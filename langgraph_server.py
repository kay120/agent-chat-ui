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
import sqlite3
from contextlib import contextmanager

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

# SQLite 数据库配置
DB_PATH = os.getenv("SQLITE_DB_PATH", "chat_history.db")

# 初始化数据库
def init_db():
    """初始化 SQLite 数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 创建线程表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS threads (
            thread_id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # 创建消息表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (thread_id) REFERENCES threads(thread_id)
        )
    """)

    conn.commit()
    conn.close()
    print(f"✅ 数据库初始化完成: {DB_PATH}")

# 初始化数据库
init_db()

# 数据库操作函数
def save_thread_to_db(thread_id: str, created_at: str = None):
    """保存线程到数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if created_at is None:
        created_at = datetime.now().isoformat()

    cursor.execute("""
        INSERT OR IGNORE INTO threads (thread_id, created_at, updated_at)
        VALUES (?, ?, ?)
    """, (thread_id, created_at, created_at))

    conn.commit()
    conn.close()

def save_message_to_db(thread_id: str, msg_id: str, msg_type: str, content: str):
    """保存消息到数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    created_at = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO messages (id, thread_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (msg_id, thread_id, msg_type, content, created_at))

    # 更新线程的 updated_at
    cursor.execute("""
        UPDATE threads SET updated_at = ? WHERE thread_id = ?
    """, (created_at, thread_id))

    conn.commit()
    conn.close()

def load_thread_from_db(thread_id: str):
    """从数据库加载线程"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 获取线程信息
    cursor.execute("""
        SELECT created_at, updated_at FROM threads WHERE thread_id = ?
    """, (thread_id,))

    thread_row = cursor.fetchone()
    if not thread_row:
        conn.close()
        return None

    created_at, updated_at = thread_row

    # 获取消息
    cursor.execute("""
        SELECT id, type, content FROM messages
        WHERE thread_id = ?
        ORDER BY created_at ASC
    """, (thread_id,))

    messages = []
    for row in cursor.fetchall():
        msg_id, msg_type, content = row
        messages.append({
            "id": msg_id,
            "type": msg_type,
            "content": content
        })

    conn.close()

    return {
        "messages": messages,
        "created_at": created_at,
        "updated_at": updated_at
    }

def load_all_threads_from_db():
    """从数据库加载所有线程"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT thread_id, created_at, updated_at FROM threads
        ORDER BY updated_at DESC
    """)

    threads = []
    for row in cursor.fetchall():
        thread_id, created_at, updated_at = row

        # 获取该线程的消息
        cursor.execute("""
            SELECT id, type, content FROM messages
            WHERE thread_id = ?
            ORDER BY created_at ASC
        """, (thread_id,))

        messages = []
        for msg_row in cursor.fetchall():
            msg_id, msg_type, content = msg_row
            messages.append({
                "id": msg_id,
                "type": msg_type,
                "content": content
            })

        threads.append({
            "thread_id": thread_id,
            "created_at": created_at,
            "updated_at": updated_at,
            "messages": messages
        })

    conn.close()
    return threads

# 线程状态存储（内存缓存，用于快速访问）
thread_states = {}

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
    # 从数据库加载所有线程
    db_threads = load_all_threads_from_db()

    threads = []
    for thread_data in db_threads:
        threads.append({
            "thread_id": thread_data["thread_id"],
            "created_at": thread_data["created_at"],
            "updated_at": thread_data["updated_at"],
            "metadata": {},
            "values": {
                "messages": thread_data["messages"]
            }
        })

    print(f"📋 搜索线程: 找到 {len(threads)} 个线程")
    return threads

@app.post("/threads/{thread_id}/runs/stream")
async def stream_run(thread_id: str, request: Request):
    """流式运行对话"""
    global llm
    
    # 初始化线程状态（如果不存在）
    if thread_id not in thread_states:
        # 先尝试从数据库加载
        db_thread = load_thread_from_db(thread_id)
        if db_thread:
            thread_states[thread_id] = db_thread
            print(f"📥 从数据库加载线程: {thread_id}")
        else:
            # 创建新线程
            created_at = datetime.now().isoformat()
            thread_states[thread_id] = {
                "messages": [],
                "created_at": created_at,
                "updated_at": created_at
            }
            # 保存到数据库
            save_thread_to_db(thread_id, created_at)
            print(f"🆕 创建新线程并保存到数据库: {thread_id}")

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

        # 添加用户消息到线程状态
        user_msg_id = str(uuid.uuid4())
        user_msg_obj = {
            "id": user_msg_id,
            "type": "human",
            "content": user_message
        }
        thread_states[thread_id]["messages"].append(user_msg_obj)
        thread_states[thread_id]["updated_at"] = datetime.now().isoformat()

        # 保存用户消息到数据库
        save_message_to_db(thread_id, user_msg_id, "human", user_message)
        print(f"💾 用户消息已保存到数据库")

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
                    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

                    # 构建完整的对话历史
                    chat_messages = [
                        SystemMessage(content="你是一个友好、有帮助的AI助手。请用中文回答用户的问题。")
                    ]

                    # 添加历史消息
                    for msg in thread_states[thread_id]["messages"]:
                        if msg["type"] == "human":
                            chat_messages.append(HumanMessage(content=msg["content"]))
                        elif msg["type"] == "ai":
                            chat_messages.append(AIMessage(content=msg["content"]))

                    print(f"📚 对话历史长度: {len(chat_messages)} 条消息")

                    # 🔄 真正的流式输出：边生成边发送
                    ai_response = ""
                    print("🔄 开始流式生成回复...")

                    # 先发送 metadata 事件
                    yield f"event: metadata\n"
                    yield f"data: {json.dumps({'run_id': run_id, 'thread_id': thread_id})}\n\n"

                    message_id = str(uuid.uuid4())

                    for chunk in llm.stream(chat_messages):
                        if hasattr(chunk, 'content') and chunk.content:
                            content = str(chunk.content) if chunk.content else ""
                            ai_response += content
                            print(f"📝 收到chunk: {content}")

                            # 🚀 立即发送流式数据
                            if "messages" in stream_mode:
                                message_data = [{
                                    "id": message_id,
                                    "type": "ai",
                                    "content": ai_response  # 发送累积的内容
                                }]
                                yield f"event: messages/partial\n"
                                yield f"data: {json.dumps(message_data)}\n\n"

                            await asyncio.sleep(0)  # 让出控制权

                    print(f"✅ AI流式回复完成: {ai_response[:100]}...")

                elif MODEL_PROVIDER == "ollama":
                    # Ollama也支持流式
                    ai_response = ""
                    message_id = str(uuid.uuid4())

                    # 先发送 metadata
                    yield f"event: metadata\n"
                    yield f"data: {json.dumps({'run_id': run_id, 'thread_id': thread_id})}\n\n"

                    for chunk in llm.stream(user_message):
                        if isinstance(chunk, str):
                            ai_response += chunk
                        elif hasattr(chunk, 'content'):
                            content = str(chunk.content) if chunk.content else ""
                            ai_response += content

                        # 立即发送流式数据
                        if "messages" in stream_mode:
                            message_data = [{
                                "id": message_id,
                                "type": "ai",
                                "content": ai_response
                            }]
                            yield f"event: messages/partial\n"
                            yield f"data: {json.dumps(message_data)}\n\n"

                        await asyncio.sleep(0)

                    print(f"✅ AI流式回复完成: {ai_response[:100]}...")
                else:
                    ai_response = "模型配置错误，请检查设置。"

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

        # 保存 AI 回复到线程状态
        response_text = str(ai_response)
        ai_msg_id = str(uuid.uuid4())
        ai_msg_obj = {
            "id": ai_msg_id,
            "type": "ai",
            "content": response_text
        }
        thread_states[thread_id]["messages"].append(ai_msg_obj)
        thread_states[thread_id]["updated_at"] = datetime.now().isoformat()

        # 保存 AI 回复到数据库
        save_message_to_db(thread_id, ai_msg_id, "ai", response_text)
        print(f"💾 已保存到线程状态和数据库，当前消息数: {len(thread_states[thread_id]['messages'])}")

        # 发送最终的 values 事件（包含完整对话）
        message_id = str(uuid.uuid4())
        user_message_id = str(uuid.uuid4())

        # 发送 values 事件
        if "values" in stream_mode:
            state_data = {
                "messages": [
                    {
                        "id": user_message_id,
                        "type": "human",
                        "content": str(user_message)
                    },
                    {
                        "id": message_id,
                        "type": "ai",
                        "content": response_text
                    }
                ]
            }
            yield f"event: values\n"
            yield f"data: {json.dumps(state_data)}\n\n"

        await asyncio.sleep(0.1)

        # 发送结束标记
        yield f"event: end\n"
        yield f"data: {json.dumps({'status': 'complete', 'run_id': run_id})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",  # SSE 格式
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Accel-Buffering": "no",  # 禁用 nginx 缓冲
        }
    )

@app.post("/threads/{thread_id}/history")
async def get_thread_history(thread_id: str, request: Request):
    """获取线程历史记录"""
    try:
        body = await request.json()
    except:
        body = {}

    # 返回线程的消息历史
    if thread_id in thread_states:
        messages = thread_states[thread_id]["messages"]
        print(f"📜 获取线程历史: {thread_id}, 消息数: {len(messages)}")
        return messages
    else:
        print(f"⚠️  线程不存在: {thread_id}")
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
    created_at = datetime.now().isoformat()

    # 初始化线程状态
    thread_states[thread_id] = {
        "messages": [],
        "created_at": created_at,
        "updated_at": created_at
    }

    # 保存到数据库
    save_thread_to_db(thread_id, created_at)
    print(f"🆕 创建新线程: {thread_id}")

    return {
        "thread_id": thread_id,
        "created_at": created_at,
        "metadata": {}
    }

@app.get("/threads/{thread_id}/state")
async def get_thread_state(thread_id: str):
    """获取线程状态"""
    if thread_id not in thread_states:
        raise HTTPException(status_code=404, detail="Thread not found")

    state = thread_states[thread_id]
    return {
        "values": {
            "messages": state["messages"]
        },
        "next": [],
        "config": {
            "configurable": {
                "thread_id": thread_id
            }
        }
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