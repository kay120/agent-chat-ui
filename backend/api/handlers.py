"""
API 请求处理器
"""
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from ..models.schemas import (
    RunInput,
    ThreadsResponse,
    DeleteResponse,
    InfoResponse,
)
from ..services.graph_service import graph_service
from ..services.thread_service import thread_service
from ..config import settings


async def handle_stream_run(run_input: RunInput) -> StreamingResponse:
    """
    处理流式运行请求

    Args:
        run_input: 运行输入

    Returns:
        流式响应
    """
    print(f"📥 收到流式请求，消息数: {len(run_input.input.messages)}")
    print(f"📝 请求数据: {run_input.model_dump()}")

    # 转换消息格式
    messages = [msg.model_dump() for msg in run_input.input.messages]
    print(f"📤 转换后的消息: {messages}")
    
    # 创建流式响应
    return StreamingResponse(
        graph_service.stream_response(messages),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


async def handle_search_threads() -> list:
    """
    处理搜索线程请求

    Returns:
        线程列表
    """
    threads = thread_service.get_all_threads()

    # 转换为前端期望的格式
    result = []
    for thread in threads:
        result.append({
            "thread_id": thread["thread_id"],
            "created_at": thread["created_at"],
            "updated_at": thread["updated_at"],
            "metadata": {},
            "values": {
                "messages": thread["messages"]
            }
        })

    print(f"📋 搜索线程: 找到 {len(result)} 个线程")
    return result


async def handle_create_thread() -> dict:
    """
    处理创建线程请求

    Returns:
        新线程信息
    """
    import uuid
    from datetime import datetime

    thread_id = str(uuid.uuid4())
    thread_service.create_thread(thread_id)

    return {
        "thread_id": thread_id,
        "created_at": datetime.now().isoformat(),
        "metadata": {}
    }


async def handle_get_thread_state(thread_id: str) -> dict:
    """
    处理获取线程状态请求

    Args:
        thread_id: 线程ID

    Returns:
        线程状态

    Raises:
        HTTPException: 线程不存在时抛出 404 错误
    """
    thread = thread_service.get_thread(thread_id)

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    return {
        "values": {
            "messages": thread["messages"]
        },
        "next": [],
        "config": {
            "configurable": {
                "thread_id": thread_id
            }
        }
    }


async def handle_delete_thread(thread_id: str) -> DeleteResponse:
    """
    处理删除线程请求
    
    Args:
        thread_id: 线程ID
        
    Returns:
        删除响应
        
    Raises:
        HTTPException: 线程不存在时抛出 404 错误
    """
    if not thread_service.thread_exists(thread_id):
        raise HTTPException(status_code=404, detail="Thread not found")
    
    thread_service.delete_thread(thread_id)
    return DeleteResponse(status="deleted", thread_id=thread_id)


async def handle_cancel_run(run_id: str) -> dict:
    """
    处理取消运行请求
    
    Args:
        run_id: 运行ID
        
    Returns:
        取消响应
    """
    print(f"🛑 收到取消请求: {run_id}")
    # 注意：当前实现中，取消主要在前端通过 AbortController 处理
    # 这里返回成功响应即可
    return {"status": "cancelled", "run_id": run_id}


async def handle_get_info() -> InfoResponse:
    """
    处理获取服务信息请求
    
    Returns:
        服务信息响应
    """
    return InfoResponse(
        status="running",
        version=settings.app_version,
        model=settings.deepseek_model,
    )

