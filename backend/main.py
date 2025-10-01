#!/usr/bin/env python3
"""
LangGraph Chat Server - 模块化版本
主应用入口
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api.routes import router


def create_app() -> FastAPI:
    """
    创建 FastAPI 应用
    
    Returns:
        FastAPI 应用实例
    """
    app = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
    )
    
    # 添加 CORS 中间件
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_credentials,
        allow_methods=settings.cors_methods,
        allow_headers=settings.cors_headers,
    )
    
    # 注册路由
    app.include_router(router)
    
    return app


# 创建应用实例
app = create_app()


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    print("🚀 Starting LangGraph Chat Server...")
    print(f"📚 Based on LangGraph tutorials")
    print(f"🌊 Real streaming with astream_events")
    print(f"🤖 Model: {settings.deepseek_model}")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    print("👋 Shutting down LangGraph Chat Server...")


def main():
    """主函数"""
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )


if __name__ == "__main__":
    main()

