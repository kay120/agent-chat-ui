"""
API 路由定义
"""
from fastapi import APIRouter, Request
from fastapi.exceptions import RequestValidationError
import json

from ..models.schemas import (
    DeleteResponse,
    InfoResponse,
)
from .handlers import (
    handle_search_threads,
    handle_create_thread,
    handle_get_thread_state,
    handle_delete_thread,
    handle_cancel_run,
    handle_get_info,
)


# 创建路由器
router = APIRouter()


@router.post("/threads/{thread_id}/runs/stream")
async def stream_run(thread_id: str, request: Request):
    """流式运行端点"""
    try:
        # 先读取原始请求体
        body = await request.body()
        print(f"🔍 完整请求体: {json.dumps(json.loads(body), indent=2, ensure_ascii=False)}")

        # 解析 JSON
        data = json.loads(body)

        # 提取消息和流式模式
        messages = data.get("input", {}).get("messages", [])
        stream_mode = data.get("stream_mode", ["messages", "values"])

        print(f"💬 用户消息: {messages[0]['content'][0]['text'] if messages else 'N/A'}")
        print(f"📡 Stream Mode: {stream_mode}")

        # 调用处理器
        from ..services.graph_service import graph_service
        from fastapi.responses import StreamingResponse

        return StreamingResponse(
            graph_service.stream_response(messages, thread_id, stream_mode),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            }
        )
    except RequestValidationError as e:
        print(f"❌ 验证错误: {e}")
        print(f"❌ 错误详情: {e.errors()}")
        raise
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        import traceback
        traceback.print_exc()
        raise


@router.post("/threads/search")
async def search_threads():
    """搜索线程"""
    return await handle_search_threads()


@router.post("/threads")
async def create_thread():
    """创建新线程"""
    return await handle_create_thread()


@router.get("/threads/{thread_id}/state")
async def get_thread_state(thread_id: str):
    """获取线程状态"""
    return await handle_get_thread_state(thread_id)


@router.delete("/threads/{thread_id}", response_model=DeleteResponse)
async def delete_thread(thread_id: str):
    """删除线程"""
    return await handle_delete_thread(thread_id)


@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str):
    """取消运行"""
    return await handle_cancel_run(run_id)


@router.get("/info", response_model=InfoResponse)
async def get_info():
    """获取服务信息"""
    return await handle_get_info()

