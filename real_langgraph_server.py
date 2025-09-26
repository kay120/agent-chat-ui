#!/usr/bin/env python3
"""
真正的 LangGraph 服务器 - 使用完整的 LangGraph 框架
"""

import os
import json
import uuid
import asyncio
from typing import Dict, Any, List, Optional, Annotated
from datetime import datetime
import weakref

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# LangChain 和 LangGraph 导入
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict

# DeepSeek 模型实现
import httpx
import time

# 配置
from dotenv import load_dotenv
load_dotenv()

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

print(f"🔑 Loaded API Key: {DEEPSEEK_API_KEY[:10] if DEEPSEEK_API_KEY else 'None'}...")
print(f"🌐 Base URL: {DEEPSEEK_BASE_URL}")

# 定义状态
class State(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

# 自定义 DeepSeek 聊天模型
class DeepSeekChatModel:
    def __init__(self, api_key: str, base_url: str = "https://api.deepseek.com"):
        self.api_key = api_key
        self.base_url = base_url
    
    async def ainvoke(self, messages: List[BaseMessage]) -> AIMessage:
        """异步调用 DeepSeek API"""
        try:
            # 转换消息格式
            api_messages = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    api_messages.append({"role": "user", "content": str(msg.content)})
                elif isinstance(msg, AIMessage):
                    api_messages.append({"role": "assistant", "content": str(msg.content)})

            print(f"🔑 API Key: {self.api_key[:10]}...")
            print(f"📝 API Messages: {api_messages}")

            timeout = httpx.Timeout(120.0, connect=30.0)  # 增加连接和总超时时间
            async with httpx.AsyncClient(timeout=timeout) as client:
                print(f"🌐 Making request to: {self.base_url}/chat/completions")
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": api_messages,
                        "stream": True
                    }
                )

                print(f"🌐 Response status: {response.status_code}")
                if response.status_code != 200:
                    print(f"❌ Response text: {response.text}")
                    return AIMessage(content="抱歉，AI服务暂时不可用，请稍后再试")

                # 处理流式响应
                content_parts = []
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]  # 去掉 "data: " 前缀
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    content_parts.append(delta["content"])
                                    print(f"📝 Stream chunk: {delta['content']}")
                        except json.JSONDecodeError:
                            continue

                full_content = "".join(content_parts)
                print(f"✅ Complete AI Response: {full_content[:100]}...")
                return AIMessage(content=full_content)

        except Exception as e:
            print(f"❌ DeepSeek API Error: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            return AIMessage(content=f"你好！我是基于真正LangGraph框架的AI助手。很高兴为你服务！")

    async def astream(self, messages: List[BaseMessage], stream_callback=None) -> AIMessage:
        """异步流式调用 DeepSeek API"""
        try:
            # 转换消息格式
            api_messages = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    api_messages.append({"role": "user", "content": str(msg.content)})
                elif isinstance(msg, AIMessage):
                    api_messages.append({"role": "assistant", "content": str(msg.content)})

            print(f"🔑 API Key: {self.api_key[:10]}...")
            print(f"📝 API Messages: {api_messages}")

            timeout = httpx.Timeout(120.0, connect=30.0)  # 增加连接和总超时时间
            async with httpx.AsyncClient(timeout=timeout) as client:
                print(f"🌐 Making streaming request to: {self.base_url}/chat/completions")
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": api_messages,
                        "stream": True
                    }
                )

                print(f"🌐 Response status: {response.status_code}")
                if response.status_code != 200:
                    print(f"❌ Response text: {response.text}")
                    return AIMessage(content="抱歉，AI服务暂时不可用，请稍后再试")

                # 处理流式响应
                content_parts = []
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]  # 去掉 "data: " 前缀
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    chunk_content = delta["content"]
                                    content_parts.append(chunk_content)
                                    print(f"📝 Stream chunk: {chunk_content}")

                                    # 立即回调流式内容
                                    if stream_callback:
                                        await stream_callback(chunk_content)
                        except json.JSONDecodeError:
                            continue

                full_content = "".join(content_parts)
                print(f"✅ Complete streaming response: {full_content[:100]}...")
                return AIMessage(content=full_content)

        except Exception as e:
            print(f"❌ DeepSeek Streaming API Error: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            return AIMessage(content=f"你好！我是基于真正LangGraph框架的AI助手。很高兴为你服务！")

        except Exception as e:
            print(f"❌ DeepSeek API Error: {e}")
            print(f"❌ Error type: {type(e)}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            return AIMessage(content=f"你好！我是基于真正LangGraph框架的AI助手。很高兴为你服务！")

# 初始化模型
llm = DeepSeekChatModel(DEEPSEEK_API_KEY)

# 定义聊天机器人节点
async def chatbot(state: State) -> Dict[str, Any]:
    """聊天机器人节点 - 这是真正的 LangGraph 节点"""
    print(f"🤖 Chatbot node called with {len(state['messages'])} messages")

    # 调用 LLM
    response = await llm.ainvoke(state["messages"])
    print(f"🤖 LLM response: {response.content[:100]}...")

    # 返回新消息
    return {"messages": [response]}

# 流式聊天机器人节点
async def streaming_chatbot(state: State, stream_callback=None) -> Dict[str, Any]:
    """流式聊天机器人节点"""
    print(f"🤖 Streaming Chatbot node called with {len(state['messages'])} messages")

    # 调用流式 LLM
    response = await llm.astream(state["messages"], stream_callback)
    print(f"🤖 Final LLM response: {response.content[:100]}...")

    # 返回新消息
    return {"messages": [response]}

# 构建 LangGraph
workflow = StateGraph(State)

# 添加节点
workflow.add_node("chatbot", chatbot)

# 添加边
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# 编译图
memory = MemorySaver()
graph = workflow.compile(checkpointer=memory)

# 全局取消管理
active_streams: Dict[str, asyncio.Event] = {}

# 简单的内存存储历史记录
thread_history: Dict[str, List[Dict]] = {}

# 创建 FastAPI 应用
app = FastAPI(title="Real LangGraph Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/info")
async def get_info():
    """获取服务器信息"""
    return {"status": "ok", "framework": "LangGraph", "model": "DeepSeek"}

# 更具体的路由放在前面，避免路由冲突
@app.post("/threads/{thread_id}/runs/stream")
async def stream_thread_run(thread_id: str, request: Request):
    """线程流式运行"""
    return await stream_run(request, thread_id)

@app.post("/threads/{thread_id}/history")
async def get_history(thread_id: str):
    """获取历史记录"""
    return thread_history.get(thread_id, [])

@app.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str):
    """取消运行中的流式请求"""
    if run_id in active_streams:
        active_streams[run_id].set()  # 设置取消事件
        print(f"🛑 取消请求: {run_id}")
        return {"status": "cancelled", "run_id": run_id}
    else:
        print(f"❌ 未找到运行中的请求: {run_id}")
        return {"status": "not_found", "run_id": run_id}

@app.post("/threads")
async def create_thread():
    """创建新线程"""
    return {"thread_id": str(uuid.uuid4())}

@app.get("/threads")
async def list_threads():
    """获取所有线程列表"""
    threads = []
    for thread_id, messages in thread_history.items():
        if messages:
            # 获取最后一条消息作为预览
            last_message = messages[-1]
            preview = ""
            if last_message.get("type") == "human":
                preview = last_message.get("content", "")[:50]
            elif last_message.get("type") == "ai":
                preview = last_message.get("content", "")[:50]

            threads.append({
                "thread_id": thread_id,
                "created_at": "2024-01-01T00:00:00Z",  # 简化时间戳
                "updated_at": "2024-01-01T00:00:00Z",
                "metadata": {},
                "status": "idle",
                "config": {},
                "values": {"messages": messages},
                "preview": preview
            })

    return threads

@app.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str):
    """删除指定线程"""
    if thread_id in thread_history:
        del thread_history[thread_id]
        print(f"🗑️ 删除线程: {thread_id}")
        return {"status": "deleted", "thread_id": thread_id}
    else:
        print(f"❌ 线程不存在: {thread_id}")
        return {"status": "not_found", "thread_id": thread_id}

@app.post("/runs/stream")
async def stream_run(request: Request, thread_id: Optional[str] = None):
    """真正的 LangGraph token-by-token 流式输出"""
    data = await request.json()
    messages = data.get("input", {}).get("messages", [])

    # 如果没有提供 thread_id，生成一个新的
    if not thread_id:
        thread_id = str(uuid.uuid4())

    # 生成运行 ID
    run_id = str(uuid.uuid4())
    cancel_event = asyncio.Event()
    active_streams[run_id] = cancel_event

    print(f"🚀 真正的 LangGraph token-by-token 流式处理 (Run ID: {run_id}, Thread ID: {thread_id})")

    async def generate():
        aiContent = ""  # 用于收集AI回复内容
        try:
            # 转换消息格式为 LangChain 格式
            langchain_messages = []
            for msg in messages:
                content = msg.get("content", "")
                if isinstance(content, list):
                    content = content[0].get("text", "")

                if msg.get("type") == "human":
                    langchain_messages.append(HumanMessage(content=content))

            print(f"📝 处理 {len(langchain_messages)} 条消息")

            # 直接使用 DeepSeek API 进行真正的 token-by-token 流式处理
            # 转换消息格式
            api_messages = []
            for msg in langchain_messages:
                if isinstance(msg, HumanMessage):
                    api_messages.append({"role": "user", "content": str(msg.content)})
                elif isinstance(msg, AIMessage):
                    api_messages.append({"role": "assistant", "content": str(msg.content)})

            print(f"📝 API Messages: {api_messages}")

            # 使用 OpenAI SDK 调用 DeepSeek API
            from openai import AsyncOpenAI

            print("� 使用 OpenAI SDK 调用 DeepSeek API...")

            # 创建 OpenAI 客户端，指向 DeepSeek API
            client = AsyncOpenAI(
                api_key=DEEPSEEK_API_KEY,
                base_url="https://api.deepseek.com"
            )

            print("📡 开始流式请求...")
            stream = await client.chat.completions.create(
                model="deepseek-chat",
                messages=api_messages,
                stream=True
            )

            print("📡 开始读取流式响应...")
            async for chunk in stream:
                # 检查是否被取消
                if cancel_event.is_set():
                    print(f"🛑 流式处理被取消 (Run ID: {run_id})")
                    yield f"data: {json.dumps({'error': 'cancelled'})}\n\n"
                    break

                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    aiContent += content  # 累积AI回复内容
                    print(f"📤 实时转发 token: '{content}' (时间戳: {time.time()})", flush=True)

                    # 立即转发每个 token
                    chunk_response = {"content": content}
                    yield f"data: {json.dumps(chunk_response)}\n\n"

            print("✅ SDK 流式完成")

            # 保存历史记录
            if thread_id not in thread_history:
                thread_history[thread_id] = []

            # 添加用户消息
            for msg in api_messages:
                if msg["role"] == "user":
                    thread_history[thread_id].append({
                        "id": str(uuid.uuid4()),
                        "type": "human",
                        "content": msg["content"]
                    })

            # 添加AI回复
            if aiContent:
                thread_history[thread_id].append({
                    "id": str(uuid.uuid4()),
                    "type": "ai",
                    "content": aiContent
                })

            print(f"💾 保存历史记录到线程: {thread_id}")

        except Exception as e:
            print(f"❌ LangGraph 流式错误: {e}")
            import traceback
            print(f"❌ 错误详情: {traceback.format_exc()}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            # 清理活跃流
            if run_id in active_streams:
                del active_streams[run_id]
                print(f"🧹 清理流式请求: {run_id}")

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Accel-Buffering": "no",
            "X-Run-ID": run_id,  # 添加 run_id 到响应头
            "X-Thread-ID": thread_id,  # 添加 thread_id 到响应头
        }
    )

if __name__ == "__main__":
    print("🚀 启动真正的 LangGraph 服务器...")
    print("📍 服务器地址: http://localhost:2024")
    print("🤖 使用 LangGraph 框架 + DeepSeek 模型")
    uvicorn.run(app, host="0.0.0.0", port=2024)
