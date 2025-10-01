"""
状态定义模块
"""
from typing import Annotated, List
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class State(TypedDict):
    """LangGraph 状态定义"""
    messages: Annotated[List[BaseMessage], add_messages]

