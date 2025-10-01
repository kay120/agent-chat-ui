#!/usr/bin/env python3
"""
真正的 LangGraph 服务器 - 基于教程的正确实现
"""

import os
import json
import uuid
import asyncio
from typing import Dict, Any, List, Optional, Annotated
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# LangChain 和 LangGraph 导入
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict
from pydantic import BaseModel

# 环境变量
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("请设置 DEEPSEEK_API_KEY 环境变量")

# FastAPI 应用
app = FastAPI(title="LangGraph Chat Server", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义状态 - 基于教程的正确方式
class State(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

# 创建 DeepSeek 模型实例（使用 OpenAI 兼容接口）
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=DEEPSEEK_API_KEY,
    base_url="https://api.deepseek.com",
    temperature=0.7,
    streaming=True  # 启用流式处理
)

# 定义聊天机器人节点 - 基于教程的正确方式
async def chatbot_node(state: State) -> Dict[str, Any]:
    """聊天机器人节点 - 真正的 LangGraph 节点"""
    print(f"🤖 Chatbot node called with {len(state['messages'])} messages")
    
    # 调用 LLM - 这里使用 LangChain 的 ChatOpenAI
    response = await llm.ainvoke(state["messages"])
    print(f"🤖 LLM response: {response.content[:100]}...")
    
    # 返回新消息 - LangGraph 会自动合并到状态中
    return {"messages": [response]}

# 构建 LangGraph - 基于教程的正确方式
workflow = StateGraph(State)

# 添加节点
workflow.add_node("chatbot", chatbot_node)

# 添加边
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# 添加内存检查点
memory = MemorySaver()

# 编译图
graph = workflow.compile(checkpointer=memory)

# 线程历史存储
thread_history: Dict[str, List[Dict[str, Any]]] = {}

# API 模型
class ChatMessage(BaseModel):
    content: str
    role: str = "user"

class ChatRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None

class ThreadInfo(BaseModel):
    thread_id: str
    created_at: str
    message_count: int
    last_message: str

@app.get("/")
async def root():
    return {"message": "LangGraph Chat Server is running!"}

@app.get("/info")
async def info():
    return {
        "server": "LangGraph Chat Server",
        "version": "1.0.0",
        "framework": "LangGraph + FastAPI",
        "model": "DeepSeek Chat",
        "features": [
            "真正的 LangGraph 实现",
            "流式输出支持",
            "线程管理",
            "状态持久化",
            "内存检查点"
        ]
    }

@app.get("/threads")
async def get_threads():
    """获取所有线程 - 返回符合 LangGraph SDK 格式的数据"""
    threads = []
    for thread_id, messages in thread_history.items():
        if messages:
            # 转换消息格式为 LangGraph SDK 期望的格式
            langgraph_messages = []
            for msg in messages:
                if msg["role"] == "user":
                    langgraph_messages.append({
                        "type": "human",
                        "content": msg["content"]
                    })
                elif msg["role"] == "assistant":
                    langgraph_messages.append({
                        "type": "ai",
                        "content": msg["content"]
                    })

            first_msg = messages[0]
            last_msg = messages[-1]

            # 构建符合 LangGraph SDK Thread 格式的对象
            thread_obj = {
                "thread_id": thread_id,
                "created_at": first_msg.get("timestamp", ""),
                "updated_at": last_msg.get("timestamp", ""),
                "metadata": {},
                "status": "idle",
                "values": {
                    "messages": langgraph_messages
                },
                "interrupts": {}
            }
            threads.append(thread_obj)

    return {"threads": sorted(threads, key=lambda x: x["created_at"], reverse=True)}

@app.get("/threads/{thread_id}")
async def get_thread_messages(thread_id: str):
    """获取特定线程的消息"""
    if thread_id not in thread_history:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    return {"messages": thread_history[thread_id]}

@app.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str):
    """删除线程"""
    if thread_id not in thread_history:
        raise HTTPException(status_code=404, detail="Thread not found")

    del thread_history[thread_id]
    print(f"🗑️ 删除线程: {thread_id}")
    return {"status": "deleted", "thread_id": thread_id}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """非流式聊天端点"""
    try:
        # 生成或使用现有线程ID
        thread_id = request.thread_id or str(uuid.uuid4())
        
        # 初始化线程历史
        if thread_id not in thread_history:
            thread_history[thread_id] = []
        
        # 添加用户消息到历史
        user_message = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        }
        thread_history[thread_id].append(user_message)
        
        # 构建消息历史
        messages = []
        for msg in thread_history[thread_id]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        
        # 使用 LangGraph 处理 - 这是关键！
        config = {"configurable": {"thread_id": thread_id}}
        result = await graph.ainvoke({"messages": messages}, config)
        
        # 获取AI响应
        ai_response = result["messages"][-1].content
        
        # 添加AI响应到历史
        ai_message = {
            "role": "assistant", 
            "content": ai_response,
            "timestamp": datetime.now().isoformat()
        }
        thread_history[thread_id].append(ai_message)
        
        return {
            "response": ai_response,
            "thread_id": thread_id
        }
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/stream")
async def stream_chat_endpoint(request: ChatRequest):
    """流式聊天端点 - 使用真正的 LangGraph 流式处理"""
    try:
        # 生成或使用现有线程ID
        thread_id = request.thread_id or str(uuid.uuid4())

        # 初始化线程历史
        if thread_id not in thread_history:
            thread_history[thread_id] = []

        # 添加用户消息到历史
        user_message = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        }
        thread_history[thread_id].append(user_message)

        # 构建消息历史
        messages = []
        for msg in thread_history[thread_id]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

        async def generate_stream():
            try:
                # 发送线程ID
                yield f"data: {json.dumps({'type': 'thread_id', 'thread_id': thread_id})}\n\n"

                # 使用 LangGraph 的流式处理 - 基于教程的正确方法
                config = {"configurable": {"thread_id": thread_id}}

                # 收集完整响应
                full_response = ""

                # 使用 astream_events 获取流式事件 - 这是关键！
                async for event in graph.astream_events(
                    {"messages": messages},
                    config,
                    version="v2"
                ):
                    kind = event["event"]

                    # 监听聊天模型的流式输出 - 基于教程
                    if kind == "on_chat_model_stream":
                        chunk_data = event["data"]
                        if "chunk" in chunk_data and hasattr(chunk_data["chunk"], "content"):
                            chunk_content = chunk_data["chunk"].content
                            if chunk_content:
                                full_response += chunk_content
                                # 发送流式数据
                                yield f"data: {json.dumps({'type': 'content', 'content': chunk_content})}\n\n"

                # 添加完整响应到历史
                if full_response:
                    ai_message = {
                        "role": "assistant",
                        "content": full_response,
                        "timestamp": datetime.now().isoformat()
                    }
                    thread_history[thread_id].append(ai_message)

                # 发送完成信号
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                print(f"❌ Stream error: {e}")
                error_msg = f"抱歉，处理您的请求时出现错误: {str(e)}"
                yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/plain; charset=utf-8"
            }
        )

    except Exception as e:
        print(f"❌ Stream setup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/runs/stream")
async def runs_stream(request: Request):
    """LangGraph SDK 兼容的流式端点"""
    try:
        # 获取原始请求体
        body = await request.body()
        print(f"🤖 LangGraph SDK runs/stream called with body: {body.decode()[:200]}...")

        # 解析 JSON
        try:
            request_data = json.loads(body.decode())
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON")

        # 从请求中提取消息 - 支持多种格式
        input_data = request_data.get("input", {})
        messages_data = input_data.get("messages", [])

        # 如果没有 input.messages，尝试直接从 messages 获取
        if not messages_data:
            messages_data = request_data.get("messages", [])

        print(f"📝 Extracted messages: {messages_data}")

        # 转换为 LangChain 消息格式
        messages = []
        for msg_data in messages_data:
            if isinstance(msg_data, dict):
                if msg_data.get("type") == "human":
                    content = msg_data.get("content", "")
                    if isinstance(content, list):
                        # 处理复杂内容格式
                        text_content = ""
                        for item in content:
                            if isinstance(item, dict) and item.get("type") == "text":
                                text_content += item.get("text", "")
                        messages.append(HumanMessage(content=text_content))
                    else:
                        messages.append(HumanMessage(content=str(content)))
                elif msg_data.get("type") == "ai":
                    messages.append(AIMessage(content=str(msg_data.get("content", ""))))

        print(f"🔄 Converted to {len(messages)} LangChain messages")

        # 如果没有消息，返回错误
        if not messages:
            print("❌ No valid messages found")
            raise HTTPException(status_code=400, detail="No messages provided")

        # 生成线程ID
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}

        # 初始化线程历史
        if thread_id not in thread_history:
            thread_history[thread_id] = []

        # 保存用户消息到历史
        for msg in messages:
            if isinstance(msg, HumanMessage):
                thread_history[thread_id].append({
                    "role": "user",
                    "content": msg.content,
                    "timestamp": datetime.now().isoformat()
                })

        async def generate():
            full_response = ""
            chunk_count = 0
            try:
                print(f"🌊 开始流式处理，线程ID: {thread_id}")
                # LangGraph SDK 格式的流式响应
                async for event in graph.astream_events(
                    {"messages": messages},
                    config,
                    version="v2"
                ):
                    kind = event["event"]
                    if kind == "on_chat_model_stream":
                        chunk_data = event["data"]
                        if "chunk" in chunk_data and hasattr(chunk_data["chunk"], "content"):
                            chunk_content = chunk_data["chunk"].content
                            if chunk_content:
                                chunk_count += 1
                                full_response += chunk_content
                                print(f"📦 收到chunk #{chunk_count}: {chunk_content[:20]}...")
                                # 使用 LangGraph SDK 兼容的格式
                                yield f"data: {json.dumps({'event': 'values', 'data': {'messages': [{'type': 'ai', 'content': chunk_content}]}})}\n\n"

                print(f"✅ 流式处理完成，共收到 {chunk_count} 个chunks，总长度: {len(full_response)}")

            except Exception as e:
                print(f"❌ LangGraph SDK stream error: {e}")
                import traceback
                traceback.print_exc()
                yield f"data: {json.dumps({'event': 'error', 'data': {'error': str(e)}})}\n\n"
            finally:
                # 保存AI回复到历史（即使流式请求被中断也要保存）
                if full_response:
                    thread_history[thread_id].append({
                        "role": "assistant",
                        "content": full_response,
                        "timestamp": datetime.now().isoformat()
                    })
                    print(f"💾 已保存对话到线程: {thread_id}, 共 {len(thread_history[thread_id])} 条消息")

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        print(f"❌ LangGraph SDK 流式处理错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("🚀 Starting LangGraph Chat Server...")
    print("📚 Based on LangGraph tutorials")
    print("🌊 Real streaming with astream_events")
    uvicorn.run(app, host="0.0.0.0", port=2024)
