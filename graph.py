"""
LangGraph 图定义 - 用于 langgraph_api
这个文件不使用相对导入，可以被 langgraph_api 直接加载
"""
import os
import sqlite3
from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.sqlite import SqliteSaver  # 使用 SQLite 持久化
from langchain_openai import ChatOpenAI


# 定义状态
class State(TypedDict):
    """对话状态"""
    messages: Annotated[list[BaseMessage], add_messages]


# 初始化 LLM
def get_llm():
    """获取 LLM 实例（从环境变量读取配置）"""
    # 从环境变量读取配置
    deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
    deepseek_base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    deepseek_model = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    max_tokens = int(os.getenv("DEEPSEEK_MAX_TOKENS", "8000"))
    temperature = float(os.getenv("DEEPSEEK_TEMPERATURE", "0.7"))

    if not deepseek_api_key:
        raise ValueError("DEEPSEEK_API_KEY 环境变量未设置")

    llm = ChatOpenAI(
        model=deepseek_model,
        api_key=deepseek_api_key,
        base_url=deepseek_base_url,
        temperature=temperature,
        streaming=True,
        max_tokens=max_tokens
    )

    print(f"✅ 已初始化 DeepSeek 模型: {deepseek_model}")
    print(f"   - max_tokens: {max_tokens}")
    print(f"   - temperature: {temperature}")
    return llm


# 创建 LLM 实例
llm = get_llm()


# 定义聊天节点
def chatbot(state: State) -> State:
    """聊天节点"""
    total_messages = len(state['messages'])
    print(f"🤖 Chatbot node called with {total_messages} messages")

    # 打印最后一条用户消息
    if state['messages']:
        last_msg = state['messages'][-1]
        # 处理不同类型的消息内容
        if isinstance(last_msg.content, str):
            content_preview = last_msg.content[:100]
        elif isinstance(last_msg.content, list):
            # 如果是列表（多模态消息），提取文本部分
            text_parts = [item.get('text', '') for item in last_msg.content if isinstance(item, dict) and 'text' in item]
            content_preview = ' '.join(text_parts)[:100]
        else:
            content_preview = str(last_msg.content)[:100]
        print(f"👤 用户消息: {content_preview}...")

    # 🚀 性能优化：只保留最近的 N 条消息，避免上下文过长
    MAX_HISTORY_MESSAGES = 10  # 最多保留 10 条消息（5 轮对话）

    messages_to_send = state["messages"]
    if len(messages_to_send) > MAX_HISTORY_MESSAGES:
        # 保留最近的 N 条消息
        messages_to_send = messages_to_send[-MAX_HISTORY_MESSAGES:]
        print(f"⚡ 性能优化: 限制上下文为最近 {MAX_HISTORY_MESSAGES} 条消息（总共 {total_messages} 条）")

    # 使用流式调用 LLM，实时输出
    print(f"🔄 开始流式调用 LLM（发送 {len(messages_to_send)} 条消息）...")
    full_content = ""

    for chunk in llm.stream(messages_to_send):
        if chunk.content:
            full_content += chunk.content
            # 实时打印每个块（只打印新增内容）
            print(chunk.content, end='', flush=True)

    print()  # 换行
    print(f"✅ 流式输出完成，总长度: {len(full_content)} 字符")

    # 创建完整的响应消息
    from langchain_core.messages import AIMessage
    response = AIMessage(content=full_content)

    # 打印 AI 回复预览
    reply_preview = full_content[:200] if len(full_content) > 200 else full_content
    print(f"🤖 AI 回复预览: {reply_preview}...")

    # 返回新状态
    return {"messages": [response]}


# 创建图
def create_graph():
    """创建 LangGraph（使用 SQLite 持久化）"""
    workflow = StateGraph(State)

    # 添加聊天节点
    workflow.add_node("chatbot", chatbot)

    # 设置入口点
    workflow.set_entry_point("chatbot")

    # 添加结束边
    workflow.add_edge("chatbot", END)

    # 🗄️ 使用 SQLite 持久化存储
    db_path = os.getenv("SQLITE_DB_PATH", "checkpoints.sqlite")
    # check_same_thread=False 允许多线程访问（SqliteSaver 内部有锁保证线程安全）
    conn = sqlite3.connect(db_path, check_same_thread=False)
    memory = SqliteSaver(conn)

    # 编译图（使用 SQLite checkpointer）
    compiled_graph = workflow.compile(checkpointer=memory)

    print("✅ LangGraph 创建完成")
    print("✅ 已启用 SQLite 持久化存储")
    print(f"   - 数据库文件: {db_path}")
    print(f"   - 重启后对话历史不会丢失")
    return compiled_graph


# 创建图实例（供 langgraph_api 使用）
graph = create_graph()

