"""
智能客服系统示例
展示 LangChain 和 LangGraph 的完整配合
"""
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage


# ============ LangChain 组件层 ============

# 1. LLM 模型
llm = init_chat_model("deepseek:deepseek-chat", temperature=0.7)

# 2. 工具定义
@tool
def query_order_status(order_id: str) -> str:
    """查询订单状态"""
    # 模拟数据库查询
    orders = {
        "12345": "已发货，预计明天送达",
        "67890": "处理中，预计今天发货"
    }
    return orders.get(order_id, "订单不存在")


@tool
def query_product_info(product_name: str) -> str:
    """查询产品信息"""
    products = {
        "手机": "最新款智能手机，价格 3999 元",
        "电脑": "高性能笔记本电脑，价格 8999 元"
    }
    return products.get(product_name, "产品不存在")


@tool
def create_ticket(issue: str) -> str:
    """创建工单"""
    ticket_id = "TICKET-" + str(hash(issue))[:6]
    return f"已创建工单 {ticket_id}，客服将在 24 小时内联系您"


# 3. 提示词模板
classifier_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是一个客服分类器。分析用户问题，返回类别：
    - order: 订单相关问题
    - product: 产品咨询
    - complaint: 投诉建议
    - general: 一般咨询
    
    只返回一个词，不要解释。"""),
    ("human", "{question}")
])

order_agent_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是订单处理专家。使用 query_order_status 工具查询订单。
    如果用户没有提供订单号，请询问订单号。"""),
    ("human", "{question}")
])

product_agent_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是产品顾问。使用 query_product_info 工具查询产品信息。
    提供专业的产品建议。"""),
    ("human", "{question}")
])

complaint_agent_prompt = ChatPromptTemplate.from_messages([
    ("system", """你是投诉处理专员。认真倾听用户问题，使用 create_ticket 创建工单。
    表达歉意并承诺跟进。"""),
    ("human", "{question}")
])


# ============ LangGraph 工作流层 ============

# 状态定义
class CustomerServiceState(TypedDict):
    messages: Annotated[list, add_messages]
    question: str
    category: str
    answer: str
    needs_human: bool


# 创建工作流
workflow = StateGraph(CustomerServiceState)


# 节点 1: 分类器（使用 LangChain LLM）
def classify_question(state: CustomerServiceState):
    """分类用户问题"""
    question = state["question"]
    
    # 使用 LangChain 的 LCEL
    chain = classifier_prompt | llm
    response = chain.invoke({"question": question})
    
    category = response.content.strip().lower()
    print(f"📋 问题分类: {category}")
    
    return {"category": category}


# 节点 2: 订单处理 Agent（使用 LangChain Tools）
def order_agent(state: CustomerServiceState):
    """处理订单问题"""
    from langgraph.prebuilt import create_react_agent
    
    # 创建专门的订单 Agent
    agent = create_react_agent(
        model=llm,
        tools=[query_order_status],
        state_modifier=order_agent_prompt.format(question=state["question"])
    )
    
    result = agent.invoke({"messages": [HumanMessage(content=state["question"])]})
    answer = result["messages"][-1].content
    
    print(f"📦 订单 Agent 回复: {answer[:50]}...")
    return {"answer": answer}


# 节点 3: 产品咨询 Agent
def product_agent(state: CustomerServiceState):
    """处理产品咨询"""
    from langgraph.prebuilt import create_react_agent
    
    agent = create_react_agent(
        model=llm,
        tools=[query_product_info],
        state_modifier=product_agent_prompt.format(question=state["question"])
    )
    
    result = agent.invoke({"messages": [HumanMessage(content=state["question"])]})
    answer = result["messages"][-1].content
    
    print(f"🛍️ 产品 Agent 回复: {answer[:50]}...")
    return {"answer": answer}


# 节点 4: 投诉处理 Agent
def complaint_agent(state: CustomerServiceState):
    """处理投诉"""
    from langgraph.prebuilt import create_react_agent
    
    agent = create_react_agent(
        model=llm,
        tools=[create_ticket],
        state_modifier=complaint_agent_prompt.format(question=state["question"])
    )
    
    result = agent.invoke({"messages": [HumanMessage(content=state["question"])]})
    answer = result["messages"][-1].content
    
    print(f"📝 投诉 Agent 回复: {answer[:50]}...")
    return {"answer": answer}


# 节点 5: 通用客服
def general_agent(state: CustomerServiceState):
    """处理一般咨询"""
    chain = ChatPromptTemplate.from_messages([
        ("system", "你是友好的客服助手，回答用户的一般问题"),
        ("human", "{question}")
    ]) | llm
    
    response = chain.invoke({"question": state["question"]})
    answer = response.content
    
    print(f"💬 通用 Agent 回复: {answer[:50]}...")
    return {"answer": answer}


# 路由函数
def route_to_agent(state: CustomerServiceState) -> Literal["order", "product", "complaint", "general"]:
    """根据分类路由到不同的 Agent"""
    category = state.get("category", "general")
    
    if category == "order":
        return "order"
    elif category == "product":
        return "product"
    elif category == "complaint":
        return "complaint"
    else:
        return "general"


# ============ 构建工作流 ============

# 添加节点
workflow.add_node("classify", classify_question)
workflow.add_node("order", order_agent)
workflow.add_node("product", product_agent)
workflow.add_node("complaint", complaint_agent)
workflow.add_node("general", general_agent)

# 定义流程
workflow.add_edge(START, "classify")

# 条件路由
workflow.add_conditional_edges(
    "classify",
    route_to_agent,
    {
        "order": "order",
        "product": "product",
        "complaint": "complaint",
        "general": "general"
    }
)

# 所有 Agent 都到结束
workflow.add_edge("order", END)
workflow.add_edge("product", END)
workflow.add_edge("complaint", END)
workflow.add_edge("general", END)

# 编译（添加持久化）
checkpointer = SqliteSaver.from_conn_string(":memory:")
customer_service_app = workflow.compile(checkpointer=checkpointer)


# ============ 使用示例 ============

def chat(question: str, thread_id: str = "user-001"):
    """与客服系统对话"""
    print(f"\n{'='*60}")
    print(f"👤 用户: {question}")
    print(f"{'='*60}")
    
    config = {"configurable": {"thread_id": thread_id}}
    
    result = customer_service_app.invoke(
        {
            "question": question,
            "messages": [],
            "category": "",
            "answer": "",
            "needs_human": False
        },
        config=config
    )
    
    print(f"\n🤖 客服: {result['answer']}")
    print(f"{'='*60}\n")
    
    return result


if __name__ == "__main__":
    # 测试不同类型的问题
    
    # 1. 订单查询
    chat("我的订单 12345 到哪了？")
    
    # 2. 产品咨询
    chat("你们的手机怎么样？")
    
    # 3. 投诉
    chat("我收到的商品有质量问题，要求退款！")
    
    # 4. 一般咨询
    chat("你们的营业时间是？")
    
    # 可视化工作流
    try:
        from IPython.display import Image, display
        display(Image(customer_service_app.get_graph().draw_mermaid_png()))
    except:
        print("提示：在 Jupyter 环境中可以可视化工作流")

