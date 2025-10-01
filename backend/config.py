"""
配置管理模块
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # API 配置
    app_title: str = "LangGraph Chat Server"
    app_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 2024
    
    # DeepSeek API 配置
    deepseek_api_key: Optional[str] = None
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    
    # LLM 配置
    llm_temperature: float = 0.7
    llm_max_tokens: int = 4096
    llm_streaming: bool = True
    
    # CORS 配置
    cors_origins: list[str] = ["*"]
    cors_credentials: bool = True
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # 忽略额外的环境变量
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 从环境变量读取 DeepSeek API Key
        if not self.deepseek_api_key:
            self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        
        if not self.deepseek_api_key:
            raise ValueError("请设置 DEEPSEEK_API_KEY 环境变量")


# 全局配置实例
settings = Settings()

