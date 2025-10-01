"""
Pydantic 模型定义
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime


class MessageContent(BaseModel):
    """消息内容"""
    type: str
    text: Optional[str] = None


class Message(BaseModel):
    """消息模型"""
    id: Optional[str] = None
    type: str  # "human" 或 "ai"
    content: str | List[MessageContent]

    class Config:
        extra = "ignore"  # 忽略额外字段


class InputMessages(BaseModel):
    """输入消息"""
    messages: List[Message]


class RunInput(BaseModel):
    """运行输入"""
    input: InputMessages


class ThreadInfo(BaseModel):
    """线程信息"""
    thread_id: str
    values: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ThreadsResponse(BaseModel):
    """线程列表响应"""
    threads: List[ThreadInfo]


class DeleteResponse(BaseModel):
    """删除响应"""
    status: str
    thread_id: str


class InfoResponse(BaseModel):
    """服务信息响应"""
    status: str
    version: str
    model: str

