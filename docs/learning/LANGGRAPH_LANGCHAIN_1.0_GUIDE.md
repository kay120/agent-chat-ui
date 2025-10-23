# LangGraph & LangChain 1.0 学习指南

## 📚 概述

本文档基于对 LangGraph 和 LangChain 1.0 源码的深入研究，提供最新版本的核心概念、API 使用和最佳实践。

### 版本信息

- **LangGraph**: v0.6.8
- **LangChain Core**: v1.0.0
- **LangChain Classic**: v1.0.0

---

## 🎯 LangGraph 核心概念

### 什么是 LangGraph？

LangGraph 是一个**低级编排框架**，用于构建、管理和部署**长时间运行的、有状态的 Agent**。

**核心优势**：
1. **持久化执行** - Agent 可以从失败中恢复，长时间运行
2. **Human-in-the-Loop** - 在执行过程中检查和修改 Agent 状态
3. **全面的记忆** - 短期工作记忆 + 长期持久化记忆
4. **调试工具** - 与 LangSmith 集成，可视化执行路径
5. **生产就绪** - 可扩展的基础设施

---

## 🚀 快速开始

### 1. 安装

```bash
# 安装 LangGraph
pip install -U langgraph

# 安装 LangChain（可选，用于集成）
pip install -U langchain langchain-core

# 安装模型提供商（根据需要选择）
pip install langchain-anthropic  # Anthropic
pip install langchain-openai     # OpenAI
pip install langchain-deepseek   # DeepSeek
```

### 2. 使用预构建 Agent（最简单）

```python
from langgraph.prebuilt import create_react_agent

# 定义工具
def get_weather(city: str) -> str:
    """获取城市天气"""
    return f"{city} 总是阳光明媚！"

# 创建 Agent
agent = create_react_agent(
    model="anthropic:claude-3-7-sonnet-latest",
    tools=[get_weather],
    prompt="你是一个有帮助的助手"
)

# 运行 Agent
response = agent.invoke({
    "messages": [{"role": "user", "content": "旧金山的天气怎么样？"}]
})
```

### 3. 构建自定义 Agent（完全控制）

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# 1. 定义状态
class State(TypedDict):
    messages: Annotated[list, add_messages]

# 2. 创建图构建器
graph_builder = StateGraph(State)

# 3. 定义节点函数
def chatbot(state: State):
    from langchain.chat_models import init_chat_model
    llm = init_chat_model("anthropic:claude-3-7-sonnet-latest")
    return {"messages": [llm.invoke(state["messages"])]}

# 4. 添加节点
graph_builder.add_node("chatbot", chatbot)

# 5. 添加边
graph_builder.add_edge(START, "chatbot")
graph_builder.add_edge("chatbot", END)

# 6. 编译图
graph = graph_builder.compile()

# 7. 运行
response = graph.invoke({
    "messages": [{"role": "user", "content": "你好！"}]
})
```

---

## 🏗️ 核心架构

### StateGraph - 状态图

**StateGraph** 是 LangGraph 的核心类，用于定义状态机。

```python
from langgraph.graph import StateGraph, START, END

# 创建状态图
graph = StateGraph(State)

# 添加节点
graph.add_node("node_name", node_function)

# 添加边（固定路径）
graph.add_edge(START, "node_name")
graph.add_edge("node_name", END)

# 添加条件边（动态路由）
graph.add_conditional_edges(
    "node_name",
    routing_function,
    {
        "path1": "next_node1",
        "path2": "next_node2",
    }
)

# 编译
compiled_graph = graph.compile()
```

### State - 状态定义

**State** 定义了图的数据结构和更新规则。

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    # 使用 add_messages reducer，消息会被追加而不是覆盖
    messages: Annotated[list, add_messages]
    
    # 普通字段，会被覆盖
    user_info: dict
    
    # 自定义 reducer
    counter: Annotated[int, lambda x, y: x + y]
```

**Reducer 函数**：
- `add_messages` - 追加消息到列表
- 自定义函数 - 定义如何合并状态更新

### Node - 节点

**Node** 是执行单元，通常是一个函数。

```python
def my_node(state: State) -> dict:
    """
    节点函数接收当前状态，返回状态更新
    """
    # 处理逻辑
    result = process(state)
    
    # 返回状态更新（部分更新）
    return {
        "messages": [result],
        "counter": 1
    }
```

### Edge - 边

**Edge** 定义节点之间的转换。

```python
# 固定边
graph.add_edge("node1", "node2")

# 条件边
def route(state: State) -> str:
    if state["counter"] > 10:
        return "end"
    return "continue"

graph.add_conditional_edges(
    "node1",
    route,
    {
        "end": END,
        "continue": "node2"
    }
)
```

---

## 💾 持久化和记忆

### Checkpointer - 检查点

**Checkpointer** 用于保存和恢复图的状态。

```python
from langgraph.checkpoint.sqlite import SqliteSaver

# 创建 SQLite checkpointer
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

# 编译时传入
graph = graph_builder.compile(checkpointer=checkpointer)

# 使用线程 ID 运行
config = {"configurable": {"thread_id": "conversation-1"}}
response = graph.invoke(input_data, config=config)
```

**支持的 Checkpointer**：
- `MemorySaver` - 内存存储（测试用）
- `SqliteSaver` - SQLite 数据库
- `PostgresSaver` - PostgreSQL 数据库
- `RedisSaver` - Redis

### 对话历史管理

```python
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("memory.db")
graph = create_react_agent(
    model=llm,
    tools=tools,
    checkpointer=checkpointer
)

# 第一轮对话
config = {"configurable": {"thread_id": "user-123"}}
graph.invoke(
    {"messages": [{"role": "user", "content": "我叫张三"}]},
    config=config
)

# 第二轮对话（记住上下文）
graph.invoke(
    {"messages": [{"role": "user", "content": "我叫什么名字？"}]},
    config=config
)
```

---

## 🌊 流式输出

### 基本流式

```python
# 流式输出每个节点的结果
for chunk in graph.stream(input_data):
    print(chunk)
```

### 流式事件（推荐）

```python
# 流式输出详细事件
async for event in graph.astream_events(input_data, version="v2"):
    kind = event["event"]
    
    if kind == "on_chat_model_stream":
        # LLM 输出的每个 token
        content = event["data"]["chunk"].content
        if content:
            print(content, end="", flush=True)
    
    elif kind == "on_tool_start":
        # 工具调用开始
        print(f"\n调用工具: {event['name']}")
    
    elif kind == "on_tool_end":
        # 工具调用结束
        print(f"工具结果: {event['data']['output']}")
```

### SSE 格式流式（用于 Web）

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def event_generator():
        async for event in graph.astream_events(
            {"messages": request.messages},
            config={"configurable": {"thread_id": request.thread_id}},
            version="v2"
        ):
            # 发送 SSE 格式
            yield f"event: {event['event']}\n"
            yield f"data: {json.dumps(event['data'])}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

---

## 🛠️ 工具调用

### 定义工具

```python
from langchain_core.tools import tool

@tool
def search(query: str) -> str:
    """搜索互联网"""
    return f"搜索结果: {query}"

@tool
def calculator(expression: str) -> float:
    """计算数学表达式"""
    return eval(expression)

tools = [search, calculator]
```

### 使用工具

```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    model="anthropic:claude-3-7-sonnet-latest",
    tools=tools
)

response = agent.invoke({
    "messages": [{"role": "user", "content": "搜索 LangGraph 并计算 2+2"}]
})
```

---

## 🔄 Human-in-the-Loop

### 中断和批准

```python
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import StateGraph, START, END

# 创建带检查点的图
checkpointer = SqliteSaver.from_conn_string("checkpoints.db")

def human_approval_node(state: State):
    # 这个节点会中断执行，等待人工批准
    return state

graph = StateGraph(State)
graph.add_node("process", process_node)
graph.add_node("approval", human_approval_node)
graph.add_node("execute", execute_node)

graph.add_edge(START, "process")
graph.add_edge("process", "approval")
graph.add_edge("approval", "execute")
graph.add_edge("execute", END)

# 编译时设置中断点
compiled = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["approval"]  # 在 approval 节点前中断
)

# 第一次运行（会在 approval 前停止）
config = {"configurable": {"thread_id": "thread-1"}}
result = compiled.invoke(input_data, config=config)

# 人工审核后继续
# 获取当前状态
state = compiled.get_state(config)

# 修改状态（如果需要）
compiled.update_state(config, {"approved": True})

# 继续执行
result = compiled.invoke(None, config=config)
```

---

## 📊 多 Agent 协作

### Supervisor 模式

```python
from langgraph.prebuilt import create_react_agent
from typing import Literal

# 创建专门的 Agent
researcher = create_react_agent(model=llm, tools=[search_tool])
writer = create_react_agent(model=llm, tools=[write_tool])

# Supervisor 路由函数
def supervisor_router(state: State) -> Literal["researcher", "writer", "end"]:
    messages = state["messages"]
    last_message = messages[-1]
    
    if "research" in last_message.content.lower():
        return "researcher"
    elif "write" in last_message.content.lower():
        return "writer"
    else:
        return "end"

# 构建 Supervisor 图
graph = StateGraph(State)
graph.add_node("researcher", researcher)
graph.add_node("writer", writer)

graph.add_conditional_edges(
    START,
    supervisor_router,
    {
        "researcher": "researcher",
        "writer": "writer",
        "end": END
    }
)

supervisor = graph.compile()
```

---

## 🎨 LangChain 1.0 核心概念

### Runnable 接口

**Runnable** 是 LangChain 的核心抽象，所有组件都实现这个接口。

```python
from langchain_core.runnables import Runnable

# 所有 Runnable 都有这些方法：
result = runnable.invoke(input)           # 同步调用
result = await runnable.ainvoke(input)    # 异步调用
for chunk in runnable.stream(input):      # 流式输出
    print(chunk)
```

### LCEL - LangChain Expression Language

**LCEL** 是用于组合 Runnable 的声明式语言。

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain.chat_models import init_chat_model

# 创建组件
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有帮助的助手"),
    ("user", "{input}")
])
model = init_chat_model("anthropic:claude-3-7-sonnet-latest")
output_parser = StrOutputParser()

# 使用 | 操作符组合
chain = prompt | model | output_parser

# 调用
result = chain.invoke({"input": "你好"})
```

---

## 📝 最佳实践

### 1. 状态设计

```python
# ✅ 好的设计
class State(TypedDict):
    messages: Annotated[list, add_messages]  # 使用 reducer
    user_id: str                              # 简单字段
    metadata: dict                            # 结构化数据

# ❌ 不好的设计
class State(TypedDict):
    everything: dict  # 太宽泛，难以维护
```

### 2. 节点函数

```python
# ✅ 好的节点函数
def my_node(state: State) -> dict:
    """清晰的文档字符串"""
    # 单一职责
    result = process_data(state["messages"])
    # 返回部分更新
    return {"messages": [result]}

# ❌ 不好的节点函数
def my_node(state: State) -> dict:
    # 做太多事情
    # 没有文档
    # 修改全局状态
    pass
```

### 3. 错误处理

```python
def safe_node(state: State) -> dict:
    try:
        result = risky_operation(state)
        return {"messages": [result]}
    except Exception as e:
        # 记录错误
        logger.error(f"节点失败: {e}")
        # 返回错误消息
        return {
            "messages": [{"role": "assistant", "content": f"抱歉，发生错误: {e}"}]
        }
```

### 4. 测试

```python
import pytest

def test_my_node():
    # 准备测试状态
    state = {
        "messages": [{"role": "user", "content": "测试"}]
    }
    
    # 调用节点
    result = my_node(state)
    
    # 断言
    assert "messages" in result
    assert len(result["messages"]) > 0
```

---

## 🔗 相关资源

### 官方文档
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [LangChain 文档](https://python.langchain.com/)
- [LangSmith](https://smith.langchain.com/)

### 本地源码
- LangGraph: `/Users/kay/code/github/agent-chat-ui/langgraph/`
- LangChain: `/Users/kay/code/github/agent-chat-ui/langchain/`

### 核心模块
- `langgraph/libs/langgraph/langgraph/graph/` - 图构建
- `langgraph/libs/langgraph/langgraph/pregel/` - 执行引擎
- `langgraph/libs/langgraph/langgraph/checkpoint/` - 持久化
- `langchain/libs/core/langchain_core/runnables/` - Runnable 接口

---

## 🎓 高级主题

### 子图 (Subgraphs)

子图允许你将复杂的图分解为可重用的组件。

```python
from langgraph.graph import StateGraph, START, END

# 定义子图状态
class SubState(TypedDict):
    data: str

# 创建子图
sub_graph = StateGraph(SubState)
sub_graph.add_node("process", lambda s: {"data": s["data"].upper()})
sub_graph.add_edge(START, "process")
sub_graph.add_edge("process", END)
compiled_sub = sub_graph.compile()

# 在主图中使用子图
class MainState(TypedDict):
    messages: Annotated[list, add_messages]
    processed_data: str

main_graph = StateGraph(MainState)

def use_subgraph(state: MainState):
    # 调用子图
    result = compiled_sub.invoke({"data": state["messages"][-1].content})
    return {"processed_data": result["data"]}

main_graph.add_node("subgraph_node", use_subgraph)
main_graph.add_edge(START, "subgraph_node")
main_graph.add_edge("subgraph_node", END)

main = main_graph.compile()
```

### 动态图 (Dynamic Graphs)

使用 `Send` 实现动态并行执行。

```python
from langgraph.types import Send

def fan_out_node(state: State):
    # 动态创建多个并行任务
    tasks = state["tasks"]
    return [
        Send("process_task", {"task": task})
        for task in tasks
    ]

def process_task(state: dict):
    # 处理单个任务
    result = process(state["task"])
    return {"results": [result]}

graph = StateGraph(State)
graph.add_node("fan_out", fan_out_node)
graph.add_node("process_task", process_task)
graph.add_node("collect", collect_results)

graph.add_conditional_edges(
    "fan_out",
    lambda s: [Send("process_task", {"task": t}) for t in s["tasks"]]
)
graph.add_edge("process_task", "collect")
```

### 重试策略

```python
from langgraph.types import RetryPolicy

# 定义重试策略
retry_policy = RetryPolicy(
    max_attempts=3,
    backoff_factor=2.0,
    retry_on=[Exception]
)

# 在节点上应用
graph.add_node(
    "risky_node",
    risky_function,
    retry=retry_policy
)
```

### 缓存策略

```python
from langgraph.types import CachePolicy

# 定义缓存策略
cache_policy = CachePolicy(
    ttl=3600,  # 1小时
    key=lambda state: state["user_id"]
)

# 在节点上应用
graph.add_node(
    "cached_node",
    expensive_function,
    cache=cache_policy
)
```

---

## 🔍 调试和监控

### 使用 LangSmith

```python
import os

# 设置 LangSmith
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-project"

# 正常运行，自动追踪
response = graph.invoke(input_data)
```

### 可视化图结构

```python
from IPython.display import Image, display

# 生成图的可视化
display(Image(graph.get_graph().draw_mermaid_png()))
```

### 打印调试信息

```python
def debug_node(state: State):
    print(f"当前状态: {state}")
    result = process(state)
    print(f"处理结果: {result}")
    return result

graph.add_node("debug", debug_node)
```

---

## 🌐 实际应用示例

### 示例 1: 带记忆的聊天机器人

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain.chat_models import init_chat_model

# 创建 checkpointer
checkpointer = SqliteSaver.from_conn_string("chat_memory.db")

# 创建模型
llm = init_chat_model("deepseek:deepseek-chat", temperature=0.7)

# 创建 agent
agent = create_react_agent(
    model=llm,
    tools=[],
    checkpointer=checkpointer
)

# 对话 1
config = {"configurable": {"thread_id": "user-123"}}
response1 = agent.invoke(
    {"messages": [{"role": "user", "content": "我叫张三，我喜欢编程"}]},
    config=config
)

# 对话 2（记住上下文）
response2 = agent.invoke(
    {"messages": [{"role": "user", "content": "我叫什么名字？我喜欢什么？"}]},
    config=config
)
```

### 示例 2: RAG (检索增强生成)

```python
from langgraph.graph import StateGraph, START, END
from langchain_core.documents import Document

class RAGState(TypedDict):
    question: str
    documents: list[Document]
    answer: str

def retrieve(state: RAGState):
    # 检索相关文档
    docs = vector_store.similarity_search(state["question"], k=3)
    return {"documents": docs}

def generate(state: RAGState):
    # 基于文档生成答案
    context = "\n".join([doc.page_content for doc in state["documents"]])
    prompt = f"基于以下上下文回答问题:\n\n{context}\n\n问题: {state['question']}"
    answer = llm.invoke(prompt)
    return {"answer": answer.content}

# 构建 RAG 图
rag_graph = StateGraph(RAGState)
rag_graph.add_node("retrieve", retrieve)
rag_graph.add_node("generate", generate)
rag_graph.add_edge(START, "retrieve")
rag_graph.add_edge("retrieve", "generate")
rag_graph.add_edge("generate", END)

rag = rag_graph.compile()

# 使用
result = rag.invoke({"question": "什么是 LangGraph？"})
print(result["answer"])
```

### 示例 3: 多步骤工作流

```python
class WorkflowState(TypedDict):
    input: str
    plan: str
    research: str
    draft: str
    final: str

def plan_step(state: WorkflowState):
    # 制定计划
    plan = llm.invoke(f"为以下任务制定计划: {state['input']}")
    return {"plan": plan.content}

def research_step(state: WorkflowState):
    # 研究
    research = search_tool.invoke(state["plan"])
    return {"research": research}

def draft_step(state: WorkflowState):
    # 起草
    draft = llm.invoke(f"基于研究结果起草: {state['research']}")
    return {"draft": draft.content}

def review_step(state: WorkflowState):
    # 审核和完善
    final = llm.invoke(f"审核并完善草稿: {state['draft']}")
    return {"final": final.content}

# 构建工作流
workflow = StateGraph(WorkflowState)
workflow.add_node("plan", plan_step)
workflow.add_node("research", research_step)
workflow.add_node("draft", draft_step)
workflow.add_node("review", review_step)

workflow.add_edge(START, "plan")
workflow.add_edge("plan", "research")
workflow.add_edge("research", "draft")
workflow.add_edge("draft", "review")
workflow.add_edge("review", END)

app = workflow.compile()

# 运行
result = app.invoke({"input": "写一篇关于 AI 的文章"})
print(result["final"])
```

---

## 📚 常见模式

### 1. ReAct Agent 模式

```python
from langgraph.prebuilt import create_react_agent

# ReAct = Reasoning + Acting
# Agent 会：思考 -> 行动 -> 观察 -> 重复

agent = create_react_agent(
    model=llm,
    tools=[search, calculator, weather],
    prompt="你是一个有帮助的助手，使用工具来回答问题"
)
```

### 2. Plan-and-Execute 模式

```python
def planner(state):
    # 制定计划
    plan = llm.invoke(f"为以下目标制定步骤: {state['goal']}")
    return {"plan": plan.content.split("\n")}

def executor(state):
    # 执行每个步骤
    results = []
    for step in state["plan"]:
        result = execute_step(step)
        results.append(result)
    return {"results": results}

graph = StateGraph(State)
graph.add_node("planner", planner)
graph.add_node("executor", executor)
graph.add_edge(START, "planner")
graph.add_edge("planner", "executor")
graph.add_edge("executor", END)
```

### 3. Reflection 模式

```python
def generate(state):
    # 生成初始答案
    answer = llm.invoke(state["question"])
    return {"answer": answer.content}

def reflect(state):
    # 反思答案质量
    reflection = llm.invoke(f"评估这个答案: {state['answer']}")
    return {"reflection": reflection.content}

def should_continue(state):
    # 决定是否需要改进
    if "good" in state["reflection"].lower():
        return "end"
    return "generate"

graph = StateGraph(State)
graph.add_node("generate", generate)
graph.add_node("reflect", reflect)

graph.add_edge(START, "generate")
graph.add_edge("generate", "reflect")
graph.add_conditional_edges(
    "reflect",
    should_continue,
    {"end": END, "generate": "generate"}
)
```

---

## ⚠️ 常见陷阱

### 1. 状态更新覆盖

```python
# ❌ 错误：会覆盖整个 messages 列表
def bad_node(state: State):
    return {"messages": [new_message]}

# ✅ 正确：使用 add_messages reducer
class State(TypedDict):
    messages: Annotated[list, add_messages]

def good_node(state: State):
    return {"messages": [new_message]}  # 会追加，不会覆盖
```

### 2. 忘记编译图

```python
# ❌ 错误
graph = StateGraph(State)
graph.add_node("node", func)
result = graph.invoke(input)  # 错误！

# ✅ 正确
graph = StateGraph(State)
graph.add_node("node", func)
compiled = graph.compile()  # 必须编译
result = compiled.invoke(input)
```

### 3. 循环依赖

```python
# ❌ 错误：创建了无限循环
graph.add_edge("node1", "node2")
graph.add_edge("node2", "node1")  # 死循环！

# ✅ 正确：使用条件边和终止条件
def should_continue(state):
    if state["counter"] > 10:
        return "end"
    return "continue"

graph.add_conditional_edges(
    "node1",
    should_continue,
    {"end": END, "continue": "node2"}
)
```

---

## 🚀 性能优化

### 1. 使用异步

```python
# 同步版本
result = graph.invoke(input)

# 异步版本（更快）
result = await graph.ainvoke(input)
```

### 2. 批处理

```python
# 批量处理多个输入
inputs = [input1, input2, input3]
results = graph.batch(inputs)
```

### 3. 并行执行

```python
from langgraph.types import Send

def parallel_node(state):
    # 并行执行多个任务
    return [
        Send("task1", data1),
        Send("task2", data2),
        Send("task3", data3),
    ]
```

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-16
**基于源码版本**: LangGraph 0.6.8, LangChain 1.0.0
