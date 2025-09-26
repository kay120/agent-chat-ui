#!/usr/bin/env python3
"""
LangGraph 服务器 - 集成真实AI模型
支持OpenAI、Ollama等多种模型提供商
"""

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict, List, Optional
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage
from pydantic import BaseModel
import uuid
from datetime import datetime
import json
import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 模型配置
MODEL_PROVIDER = os.getenv("MODEL_PROVIDER", "deepseek")  # openai, deepseek, ollama, mock
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# 初始化模型
llm = None

def init_model():
    global llm
    try:
        if MODEL_PROVIDER == "openai" and OPENAI_API_KEY:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model=OPENAI_MODEL,
                temperature=0.7,
                streaming=True
            )
            # 设置 API key 为环境变量
            os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
            print(f"✅ 已初始化 OpenAI 模型: {OPENAI_MODEL}")
        
        elif MODEL_PROVIDER == "deepseek" and DEEPSEEK_API_KEY:
            from langchain_openai import ChatOpenAI
            # 设置 DeepSeek API 配置
            os.environ["OPENAI_API_KEY"] = DEEPSEEK_API_KEY
            os.environ["OPENAI_API_BASE"] = DEEPSEEK_BASE_URL
            llm = ChatOpenAI(
                model=DEEPSEEK_MODEL,
                temperature=0.7,
                streaming=True,
                base_url=DEEPSEEK_BASE_URL
            )
            print(f"✅ 已初始化 DeepSeek 模型: {DEEPSEEK_MODEL}")
        
        elif MODEL_PROVIDER == "ollama":
            try:
                from langchain_community.llms import Ollama
                from langchain_core.language_models.chat_models import BaseChatModel
                # 使用 Ollama 作为基础模型
                llm = Ollama(
                    model=OLLAMA_MODEL,
                    base_url=OLLAMA_BASE_URL,
                    temperature=0.7
                )
                print(f"✅ 已初始化 Ollama 模型: {OLLAMA_MODEL}")
            except ImportError:
                print(f"⚠️  Ollama 导入失败，将使用模拟模式")
                llm = None
        
        else:
            print(f"⚠️  未配置有效的模型提供商，将使用模拟模式")
            print(f"📝 当前配置: MODEL_PROVIDER={MODEL_PROVIDER}")
            if MODEL_PROVIDER == "openai":
                print(f"💡 请设置 OPENAI_API_KEY 环境变量")
            elif MODEL_PROVIDER == "deepseek":
                print(f"💡 请设置 DEEPSEEK_API_KEY 环境变量")
            
    except Exception as e:
        print(f"❌ 模型初始化失败: {e}")
        print(f"📝 将使用模拟模式")
        llm = None

# 初始化模型
init_model()

# 定义状态
class AgentState(TypedDict):
    messages: list

# 简单的聊天节点
def chat_node(state: AgentState) -> AgentState:
    global llm
    messages = state["messages"]
    last_message = messages[-1]
    
    if isinstance(last_message, HumanMessage):
        user_input = last_message.content
        print(f"📝 用户输入: {user_input}")
        
        try:
            if llm is not None:
                print(f"🤖 使用 {MODEL_PROVIDER} 模型处理请求...")
                
                # 准备对话历史
                chat_messages = []
                
                # 添加系统消息
                from langchain_core.messages import SystemMessage
                system_msg = SystemMessage(content="你是一个友好、有帮助的AI助手。请用中文回答用户的问题。")
                chat_messages.append(system_msg)
                
                # 添加历史消息（最多保留最近10条）
                recent_messages = messages[-10:] if len(messages) > 10 else messages
                for msg in recent_messages:
                    chat_messages.append(msg)
                
                # 调用大模型
                if MODEL_PROVIDER == "openai" or MODEL_PROVIDER == "deepseek":
                    response = llm.invoke(chat_messages)
                    ai_response = response.content
                elif MODEL_PROVIDER == "ollama":
                    # Ollama 可能需要不同的调用方式
                    response = llm.invoke(user_input)
                    ai_response = response if isinstance(response, str) else str(response)
                else:
                    ai_response = "模型配置错误，请检查设置。"
                    
                print(f"✅ AI回复: {ai_response[:100]}...")
                
            else:
                # 模拟模式回复
                print("⚠️  使用模拟模式回复")
                user_text = str(user_input)  # 确保是字符串类型
                if "你好" in user_text or "hello" in user_text.lower():
                    ai_response = "你好！我是AI助手，很高兴为你服务！有什么我可以帮助你的吗？\n\n⚠️ 当前运行在模拟模式，请配置真实的AI模型。"
                elif "天气" in user_text:
                    ai_response = "抱歉，我目前无法获取实时天气信息。你可以查看天气应用或网站获取准确的天气预报。\n\n⚠️ 当前运行在模拟模式，请配置真实的AI模型。"
                elif "时间" in user_text:
                    from datetime import datetime
                    current_time = datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")
                    ai_response = f"当前时间是：{current_time}\n\n⚠️ 当前运行在模拟模式，请配置真实的AI模型。"
                else:
                    ai_response = f"我收到了你的消息：{user_text}。\n\n⚠️ 当前运行在模拟模式，请配置真实的AI模型以获得智能回复。"
        
        except Exception as e:
            print(f"❌ 模型调用失败: {e}")
            ai_response = f"抱歉，处理你的请求时出现了错误：{str(e)}\n\n请检查模型配置是否正确。"
        
        response = AIMessage(content=ai_response)
        return {"messages": messages + [response]}
    
    return {"messages": messages}

# 创建图
def create_graph():
    workflow = StateGraph(AgentState)
    
    # 添加节点
    workflow.add_node("chat", chat_node)
    
    # 设置入口点
    workflow.set_entry_point("chat")
    
    # 添加结束
    workflow.add_edge("chat", END)
    
    # 编译图
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

# 创建 FastAPI 应用
app = FastAPI(title="LangGraph Test Server")

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # 允许前端访问
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = create_graph()

@app.get("/")
async def root():
    return {"message": "LangGraph Server is running"}

@app.get("/info")
async def info():
    return {
        "assistant_id": "agent",
        "graph_id": "agent",
        "status": "running"
    }

# 数据模型
class ThreadSearchRequest(BaseModel):
    limit: int = 10
    offset: int = 0
    metadata: dict = {}
    status: str = "idle"

class RunRequest(BaseModel):
    input: dict
    stream_mode: list = ["updates"]
    assistant_id: str = "agent"
    thread_id: Optional[str] = None
    config: Optional[dict] = None
    metadata: Optional[dict] = None
    multitask_strategy: Optional[str] = None
    stream_subgraphs: bool = False
    stream_resumable: bool = False
    on_disconnect: str = "continue"

@app.post("/threads/search")
async def search_threads():
    """搜索线程"""
    # 根据LangGraph API规范，直接返回threads数组
    return []

@app.post("/threads/{thread_id}/runs/stream")
async def stream_run(thread_id: str, request: Request):
    """流式运行对话"""
    global llm
    
    # 直接从原始请求中解析JSON
    try:
        body = await request.json()
        print(f"🔍 完整请求体: {json.dumps(body, indent=2, ensure_ascii=False)}")

        # 提取用户消息
        user_message = "你好"
        if body and "input" in body and "messages" in body["input"]:
            messages = body["input"]["messages"]
            if messages and len(messages) > 0:
                last_message = messages[-1]
                if "content" in last_message:
                    if isinstance(last_message["content"], list) and len(last_message["content"]) > 0:
                        # 处理数组格式的content
                        content_item = last_message["content"][0]
                        if isinstance(content_item, dict) and "text" in content_item:
                            user_message = content_item["text"]
                        else:
                            user_message = str(content_item)
                    elif isinstance(last_message["content"], str):
                        user_message = last_message["content"]

        print(f"💬 用户消息: {user_message}")

        # 提取stream_mode
        stream_mode = body.get("stream_mode", ["updates"])
        print(f"📡 Stream Mode: {stream_mode}")

    except Exception as e:
        # 如果解析失败，使用默认消息
        print(f"❌ 请求解析失败: {e}")
        user_message = "你好"
        stream_mode = ["updates"]
    
    async def generate_stream():
        # 流式响应
        run_id = str(uuid.uuid4())
        
        # 生成AI回复
        try:
            if llm is not None:
                print(f"🤖 使用 {MODEL_PROVIDER} 模型处理流式请求...")
                
                # 准备消息
                if MODEL_PROVIDER == "openai" or MODEL_PROVIDER == "deepseek":
                    from langchain_core.messages import SystemMessage, HumanMessage
                    chat_messages = [
                        SystemMessage(content="你是一个友好、有帮助的AI助手。请用中文回答用户的问题。"),
                        HumanMessage(content=user_message)
                    ]

                    # 使用流式调用而不是普通调用
                    ai_response = ""
                    print("🔄 开始流式生成回复...")
                    for chunk in llm.stream(chat_messages):
                        if hasattr(chunk, 'content') and chunk.content:
                            content = str(chunk.content) if chunk.content else ""
                            ai_response += content
                            print(f"📝 收到chunk: {content}")

                elif MODEL_PROVIDER == "ollama":
                    # Ollama也支持流式
                    ai_response = ""
                    for chunk in llm.stream(user_message):
                        if isinstance(chunk, str):
                            ai_response += chunk
                        elif hasattr(chunk, 'content'):
                            content = str(chunk.content) if chunk.content else ""
                            ai_response += content
                else:
                    ai_response = "模型配置错误，请检查设置。"

                print(f"✅ AI流式回复完成: {ai_response[:100]}...")
                
            else:
                # 模拟模式回复
                print("⚠️  使用模拟模式流式回复")
                user_text = str(user_message)
                if "你好" in user_text or "hello" in user_text.lower():
                    ai_response = "你好！我是AI助手，很高兴为你服务！有什么我可以帮助你的吗？\n\n⚠️ 当前运行在模拟模式，请配置真实的AI模型。"
                else:
                    ai_response = f"我收到了你的消息：{user_text}。\n\n⚠️ 当前运行在模拟模式，请配置真实的AI模型以获得智能回复。"
        
        except Exception as e:
            print(f"❌ 流式模型调用失败: {e}")
            ai_response = f"抱歉，处理你的请求时出现了错误：{str(e)}\n\n请检查模型配置是否正确。"
        
        # 返回符合LangGraph SDK期望的JSON Lines格式
        # 1. 发送运行开始
        yield json.dumps({"run_id": run_id, "thread_id": thread_id}) + "\n"

        await asyncio.sleep(0.1)

        # 2. 根据stream_mode发送相应格式的消息更新
        response_text = str(ai_response)
        message_id = str(uuid.uuid4())
        user_message_id = str(uuid.uuid4())

        # 为每个stream_mode生成相应的数据
        for mode in stream_mode:
            if mode == "values":
                # values模式：发送完整状态，包括用户消息和AI回复
                state_data = {
                    "messages": [
                        {
                            "id": user_message_id,
                            "type": "human",
                            "content": [
                                {
                                    "type": "text",
                                    "text": str(user_message)
                                }
                            ]
                        },
                        {
                            "id": message_id,
                            "type": "ai",
                            "content": [
                                {
                                    "type": "text",
                                    "text": response_text
                                }
                            ]
                        }
                    ]
                }
                yield json.dumps(state_data) + "\n"
            elif mode == "updates":
                # updates模式：发送节点更新
                update_data = {
                    "chat": {  # 使用节点名
                        "messages": [
                            {
                                "id": message_id,
                                "type": "ai",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": response_text
                                    }
                                ]
                            }
                        ]
                    }
                }
                yield json.dumps(update_data) + "\n"
            elif mode == "messages-tuple":
                # messages-tuple模式：发送LLM token信息
                message_chunk = {
                    "type": "ai",
                    "content": response_text
                }
                metadata = {
                    "langgraph_node": "chat",
                    "run_id": run_id
                }
                yield json.dumps([message_chunk, metadata]) + "\n"
            elif mode == "custom":
                # custom模式：发送自定义数据
                custom_data = {
                    "type": "custom",
                    "data": {
                        "message": response_text,
                        "node": "chat"
                    }
                }
                yield json.dumps(custom_data) + "\n"

        await asyncio.sleep(0.1)

        # 3. 发送结束标记
        yield json.dumps({"status": "complete", "run_id": run_id}) + "\n"
    
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

@app.post("/threads/{thread_id}/history")
async def get_thread_history(thread_id: str, request: Request):
    """获取线程历史记录"""
    try:
        body = await request.json()
    except:
        body = {}
    
    # 返回LangGraph SDK期望的数组格式
    # SDK期望的是一个数组，不是带有values的对象
    return []

@app.post("/threads/{thread_id}/messages")
async def add_message_to_thread(thread_id: str, request: Request):
    """向线程添加消息"""
    try:
        body = await request.json()
        # 验证消息格式
        if not body or "content" not in body:
            return {"status": "error", "message": "Missing message content"}

        # 返回成功响应 - 兼容LangGraph SDK格式
        return {
            "status": "success",
            "message_id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "created_at": datetime.now().isoformat(),
            "content": body.get("content", ""),
            "type": body.get("type", "human")
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to add message: {str(e)}"}

@app.post("/threads")
async def create_thread():
    """创建新线程"""
    thread_id = str(uuid.uuid4())
    return {
        "thread_id": thread_id,
        "created_at": datetime.now().isoformat(),
        "metadata": {}
    }

if __name__ == "__main__":
    print("🚀 启动 LangGraph 测试服务器...")
    print("📍 服务器地址: http://localhost:2024")
    print("🔗 Agent Chat UI 可以连接到此服务器")
    
    uvicorn.run(
        "langgraph_server:app",
        host="localhost",
        port=2024,
        reload=True
    )