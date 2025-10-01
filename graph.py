"""
LangGraph 图定义 - 用于 langgraph_api
这个文件不使用相对导入，可以被 langgraph_api 直接加载
"""
import os
from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI


# 定义状态
class State(TypedDict):
    """对话状态"""
    messages: Annotated[list[BaseMessage], add_messages]


# 初始化 LLM
def get_llm():
    """获取 LLM 实例"""
    deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
    deepseek_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    
    if not deepseek_api_key:
        raise ValueError("DEEPSEEK_API_KEY 环境变量未设置")
    
    llm = ChatOpenAI(
        model=deepseek_model,
        api_key=deepseek_api_key,
        base_url=deepseek_base_url,
        temperature=0.7,
        streaming=True
    )
    
    print(f"✅ 已初始化 DeepSeek 模型: {deepseek_model}")
    return llm


# 创建 LLM 实例
llm = get_llm()


# 定义聊天节点
def chatbot(state: State) -> State:
    """聊天节点"""
    print(f"🤖 Chatbot node called with {len(state['messages'])} messages")
    
    # 调用 LLM
    response = llm.invoke(state["messages"])
    
    # 返回新状态
    return {"messages": [response]}


# 创建图
def create_graph():
    """创建 LangGraph"""
    workflow = StateGraph(State)

    # 添加聊天节点
    workflow.add_node("chatbot", chatbot)

    # 设置入口点
    workflow.set_entry_point("chatbot")

    # 添加结束边
    workflow.add_edge("chatbot", END)

    # 编译图（不提供 checkpointer，让 langgraph_api 自动处理）
    compiled_graph = workflow.compile()

    print("✅ LangGraph 创建完成")
    return compiled_graph


# 创建图实例（供 langgraph_api 使用）
graph = create_graph()

