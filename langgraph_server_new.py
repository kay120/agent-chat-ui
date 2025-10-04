#!/usr/bin/env python3
"""
标准LangGraph服务器实现
基于LangGraph官方文档和最佳实践
"""

import os
import json
import uuid
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any, TypedDict, Annotated, Sequence
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI

# 配置 DeepSeek API
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("DEEPSEEK_API_KEY 环境变量未设置")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

# 初始化 DeepSeek 模型
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
    temperature=0.7,
    max_tokens=1000,
)

print("✅ 已初始化 DeepSeek 模型: deepseek-chat")

# 定义状态 - 使用标准的LangGraph消息状态
class AgentState(TypedDict):
    """Agent状态，包含消息列表"""
    messages: Annotated[Sequence[BaseMessage], add_messages]

# 定义聊天节点
def chat_node(state: AgentState) -> Dict[str, Any]:
    """处理聊天消息的节点"""
    messages = state["messages"]
    
    # 获取最后一条用户消息
    last_message = messages[-1] if messages else None
    if not last_message or not isinstance(last_message, HumanMessage):
        return {"messages": [AIMessage(content="请发送一条消息。")]}
    
    print(f"💬 处理用户消息: {last_message.content}")
    
    # 使用流式调用LLM
    print("🔄 开始流式生成回复...")
    ai_response = ""
    
    try:
        # 使用流式调用
        for chunk in llm.stream(messages):
            if hasattr(chunk, 'content') and chunk.content:
                content = str(chunk.content) if chunk.content else ""
                ai_response += content
                print(f"📝 收到chunk: {content}")
        
        print(f"✅ AI流式回复完成: {ai_response[:100]}...")
        
        # 返回AI消息
        return {"messages": [AIMessage(content=ai_response)]}
        
    except Exception as e:
        print(f"❌ LLM调用失败: {e}")
        return {"messages": [AIMessage(content=f"抱歉，处理您的请求时出现错误: {str(e)}")]}

# 创建LangGraph图
def create_graph():
    """创建标准的LangGraph图"""
    workflow = StateGraph(AgentState)
    
    # 添加聊天节点
    workflow.add_node("chat", chat_node)
    
    # 设置入口点
    workflow.set_entry_point("chat")
    
    # 添加结束边
    workflow.add_edge("chat", END)
    
    # 编译图，使用内存检查点
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

# 创建图实例
graph = create_graph()

# 创建 FastAPI 应用
app = FastAPI(title="LangGraph Standard Server", version="1.0.0")

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class RunRequest(BaseModel):
    input: dict
    stream_mode: List[str] = ["values"]
    assistant_id: str = "agent"
    thread_id: Optional[str] = None
    config: Optional[dict] = None
    metadata: Optional[dict] = None
    multitask_strategy: Optional[str] = None
    stream_subgraphs: bool = False
    stream_resumable: bool = False
    on_disconnect: str = "continue"

@app.get("/")
async def root():
    return {"message": "LangGraph Standard Server is running"}

@app.get("/info")
async def info():
    return {
        "assistant_id": "agent",
        "graph_id": "agent",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/threads")
async def create_thread():
    """创建新线程"""
    thread_id = str(uuid.uuid4())
    return {
        "thread_id": thread_id,
        "created_at": datetime.now().isoformat(),
        "metadata": {},
        "status": "idle"
    }

@app.post("/threads/search")
async def search_threads():
    """搜索线程"""
    return []

@app.post("/threads/{thread_id}/history")
async def get_thread_history(thread_id: str):
    """获取线程历史"""
    # 返回空历史数组，因为我们使用内存存储
    # LangGraph SDK期望的是数组格式，不是对象格式
    return []

# 标准的LangGraph流式端点
@app.post("/runs/stream")
async def stream_run(request: Request):
    """标准的LangGraph流式运行端点"""
    return await _handle_stream_request(request)

# 兼容旧版本的端点
@app.post("/threads/{thread_id}/runs/stream")
async def stream_run_with_thread(thread_id: str, request: Request):
    """兼容旧版本的流式运行端点"""
    return await _handle_stream_request(request, thread_id)

async def _handle_stream_request(request: Request, thread_id: Optional[str] = None):
    """处理流式请求的核心逻辑"""
    try:
        body = await request.json()
        print(f"🔍 收到流式请求: {json.dumps(body, indent=2, ensure_ascii=False)}")

        # 解析请求
        input_data = body.get("input", {})
        stream_mode = body.get("stream_mode", ["values"])
        request_thread_id = body.get("thread_id") or thread_id
        
        # 提取消息
        messages = input_data.get("messages", [])
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")
        
        # 转换消息格式
        langchain_messages = []
        for msg in messages:
            if msg.get("type") == "human":
                # 处理content字段，可能是字符串或数组
                content = msg.get("content", "")
                if isinstance(content, list):
                    # 如果是数组，提取text内容
                    text_content = ""
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            text_content += item.get("text", "")
                    content = text_content
                langchain_messages.append(HumanMessage(content=content))
            elif msg.get("type") == "ai":
                content = msg.get("content", "")
                if isinstance(content, list):
                    text_content = ""
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            text_content += item.get("text", "")
                    content = text_content
                langchain_messages.append(AIMessage(content=content))
        
        print(f"💬 处理 {len(langchain_messages)} 条消息")
        
        # 配置
        config = {
            "configurable": {
                "thread_id": request_thread_id or str(uuid.uuid4())
            }
        }
        
        def serialize_message(msg):
            """序列化消息对象为JSON可序列化的格式"""
            if isinstance(msg, BaseMessage):
                return {
                    "id": getattr(msg, 'id', str(uuid.uuid4())),
                    "type": "human" if isinstance(msg, HumanMessage) else "ai",
                    "content": [{"type": "text", "text": str(msg.content)}] if isinstance(msg.content, str) else msg.content
                }
            return msg

        def serialize_chunk(chunk):
            """递归序列化chunk为JSON可序列化的格式"""
            if isinstance(chunk, dict):
                serialized = {}
                for key, value in chunk.items():
                    if key == "messages" and isinstance(value, list):
                        serialized[key] = [serialize_message(msg) for msg in value]
                    elif isinstance(value, dict):
                        serialized[key] = serialize_chunk(value)
                    elif isinstance(value, list):
                        serialized[key] = [serialize_chunk(item) if isinstance(item, dict) else serialize_message(item) if isinstance(item, BaseMessage) else item for item in value]
                    elif isinstance(value, BaseMessage):
                        serialized[key] = serialize_message(value)
                    else:
                        serialized[key] = value
                return serialized
            elif isinstance(chunk, BaseMessage):
                return serialize_message(chunk)
            return chunk

        async def generate_stream():
            """生成符合LangGraph官方标准的流式响应"""
            run_id = str(uuid.uuid4())

            try:
                # 1. 首先发送运行开始事件（符合LangGraph官方格式）
                run_start_event = {
                    "run_id": run_id,
                    "attempt": 1
                }
                yield f"data: {json.dumps(run_start_event, ensure_ascii=False)}\n\n"
                print(f"📡 发送运行开始事件: {run_start_event}")

                # 2. 使用LangGraph的标准流式方法
                # 注意：根据LangGraph源码，当stream_mode是列表时返回(mode, payload)，否则直接返回payload
                async for chunk in graph.astream(
                    {"messages": langchain_messages},
                    config=config,
                    stream_mode=stream_mode
                ):
                    print(f"🔍 收到LangGraph chunk: {type(chunk)} - {chunk}")

                    # 根据LangGraph源码处理不同的返回格式
                    data_to_process = None

                    # 如果stream_mode是列表，LangGraph返回(mode, payload)元组
                    if isinstance(chunk, tuple) and len(chunk) == 2:
                        stream_mode_name, data = chunk
                        print(f"📡 Stream mode: {stream_mode_name}, Data: {type(data)}")
                        data_to_process = data
                    # 如果stream_mode不是列表，LangGraph直接返回payload
                    elif isinstance(chunk, dict):
                        print(f"📡 直接数据格式: {type(chunk)}")
                        data_to_process = chunk
                    else:
                        print(f"⚠️ 未知chunk格式: {type(chunk)}")
                        continue

                    # 3. 处理数据并发送状态更新
                    if isinstance(data_to_process, dict):
                        # 处理messages数据
                        if "messages" in data_to_process:
                            # 序列化消息为LangGraph SDK期望的格式
                            messages_data = []
                            for msg in data_to_process["messages"]:
                                if isinstance(msg, BaseMessage):
                                    msg_data = {
                                        "id": getattr(msg, 'id', str(uuid.uuid4())),
                                        "type": "human" if isinstance(msg, HumanMessage) else "ai",
                                        "content": [{"type": "text", "text": str(msg.content)}]
                                    }
                                    messages_data.append(msg_data)

                            # 发送状态更新（符合LangGraph官方格式）
                            state_update = {"messages": messages_data}
                            yield f"data: {json.dumps(state_update, ensure_ascii=False)}\n\n"
                            print(f"✅ 发送状态更新: {len(messages_data)} 条消息")

                        # 处理其他类型的数据（如updates模式）
                        else:
                            # 直接发送数据
                            yield f"data: {json.dumps(data_to_process, ensure_ascii=False)}\n\n"
                            print(f"✅ 发送其他数据更新: {type(data_to_process)}")

                    # 添加小延迟以确保流式效果
                    await asyncio.sleep(0.01)

            except Exception as e:
                print(f"❌ 流式处理错误: {e}")
                import traceback
                traceback.print_exc()
                error_chunk = {"error": str(e), "run_id": run_id}
                yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        print(f"❌ 请求处理失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 启动标准LangGraph服务器...")
    print("📍 服务器地址: http://localhost:2024")
    print("🔗 Agent Chat UI 可以连接到此服务器")

    uvicorn.run(
        "langgraph_server_new:app",
        host="0.0.0.0",
        port=2024,
        reload=True
    )
