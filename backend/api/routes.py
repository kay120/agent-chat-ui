"""
API 路由定义
"""
from fastapi import APIRouter, Request
from fastapi.exceptions import RequestValidationError
import json

from ..models.schemas import (
    RunInput,
    ThreadsResponse,
    DeleteResponse,
    InfoResponse,
)
from .handlers import (
    handle_stream_run,
    handle_get_threads,
    handle_delete_thread,
    handle_cancel_run,
    handle_get_info,
)


# 创建路由器
router = APIRouter()


@router.post("/runs/stream")
async def stream_run(request: Request):
    """流式运行端点"""
    try:
        # 先读取原始请求体
        body = await request.body()
        print(f"📨 收到原始请求体: {body.decode('utf-8')}")

        # 解析 JSON
        data = json.loads(body)
        print(f"📦 解析后的数据: {data}")

        # 验证并转换为 RunInput
        run_input = RunInput(**data)
        return await handle_stream_run(run_input)
    except RequestValidationError as e:
        print(f"❌ 验证错误: {e}")
        print(f"❌ 错误详情: {e.errors()}")
        raise
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        raise


@router.get("/threads", response_model=ThreadsResponse)
async def get_threads():
    """获取所有线程"""
    return await handle_get_threads()


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

