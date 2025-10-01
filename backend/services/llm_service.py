"""
LLM 服务模块
"""
from langchain_openai import ChatOpenAI
from ..config import settings


class LLMService:
    """LLM 服务类"""
    
    def __init__(self):
        """初始化 LLM 服务"""
        self.llm = ChatOpenAI(
            model=settings.deepseek_model,
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            streaming=settings.llm_streaming,
        )
        print(f"✅ LLM 服务初始化完成: {settings.deepseek_model}")
    
    def get_llm(self):
        """获取 LLM 实例"""
        return self.llm


# 全局 LLM 服务实例
llm_service = LLMService()

