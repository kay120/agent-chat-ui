# LangGraph 快速参考

## 📦 安装

```bash
pip install -U langgraph langchain langchain-deepseek
```

## 🚀 快速开始

### 预构建 Agent

```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(
    model="deepseek:deepseek-chat",
    tools=[tool1, tool2],
    prompt="系统提示"
)

response = agent.invoke({"messages": [{"role": "user", "content": "问题"}]})
```

### 自定义 Agent

```python
from langgraph.graph import StateGraph, START, END
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

# 1. 定义状态
class State(TypedDict):
    messages: Annotated[list, add_messages]

# 2. 创建图
graph = StateGraph(State)

# 3. 添加节点
def my_node(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

graph.add_node("node_name", my_node)

# 4. 添加边
graph.add_edge(START, "node_name")
graph.add_edge("node_name", END)

# 5. 编译
app = graph.compile()

# 6. 运行
result = app.invoke({"messages": [{"role": "user", "content": "你好"}]})
```

## 🏗️ 核心 API

### StateGraph

```python
from langgraph.graph import StateGraph, START, END

graph = StateGraph(State)

# 添加节点
graph.add_node("name", function)

# 添加固定边
graph.add_edge(START, "node1")
graph.add_edge("node1", "node2")
graph.add_edge("node2", END)

# 添加条件边
graph.add_conditional_edges(
    "node1",
    routing_function,
    {"path1": "node2", "path2": END}
)

# 编译
app = graph.compile()
```

### State 定义

```python
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class State(TypedDict):
    # 使用 reducer（追加）
    messages: Annotated[list, add_messages]
    
    # 普通字段（覆盖）
    user_id: str
    counter: int
    
    # 自定义 reducer
    total: Annotated[int, lambda x, y: x + y]
```

### 节点函数

```python
def my_node(state: State) -> dict:
    """
    接收当前状态，返回状态更新
    """
    # 处理逻辑
    result = process(state)
    
    # 返回部分更新
    return {
        "messages": [result],
        "counter": state["counter"] + 1
    }
```

## 💾 持久化

### SQLite Checkpointer

```python
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("memory.db")

app = graph.compile(checkpointer=checkpointer)

# 使用线程 ID
config = {"configurable": {"thread_id": "user-123"}}
result = app.invoke(input_data, config=config)
```

### 内存 Checkpointer

```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
app = graph.compile(checkpointer=checkpointer)
```

## 🌊 流式输出

### 基本流式

```python
for chunk in app.stream(input_data):
    print(chunk)
```

### 流式事件

```python
async for event in app.astream_events(input_data, version="v2"):
    if event["event"] == "on_chat_model_stream":
        content = event["data"]["chunk"].content
        if content:
            print(content, end="", flush=True)
```

### SSE 格式

```python
async def event_generator():
    async for event in app.astream_events(input_data, version="v2"):
        yield f"event: {event['event']}\n"
        yield f"data: {json.dumps(event['data'])}\n\n"
```

## 🛠️ 工具

### 定义工具

```python
from langchain_core.tools import tool

@tool
def my_tool(param: str) -> str:
    """工具描述"""
    return f"结果: {param}"

tools = [my_tool]
```

### 使用工具

```python
agent = create_react_agent(
    model=llm,
    tools=tools
)
```

## 🔄 条件路由

```python
def router(state: State) -> str:
    if condition:
        return "path1"
    return "path2"

graph.add_conditional_edges(
    "source_node",
    router,
    {
        "path1": "node1",
        "path2": "node2"
    }
)
```

## 🎯 Human-in-the-Loop

```python
# 编译时设置中断点
app = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["approval_node"]
)

# 第一次运行（会中断）
config = {"configurable": {"thread_id": "thread-1"}}
result = app.invoke(input_data, config=config)

# 获取状态
state = app.get_state(config)

# 修改状态
app.update_state(config, {"approved": True})

# 继续执行
result = app.invoke(None, config=config)
```

## 📊 多 Agent

### Supervisor 模式

```python
def supervisor(state: State) -> str:
    if "research" in state["messages"][-1].content:
        return "researcher"
    elif "write" in state["messages"][-1].content:
        return "writer"
    return "end"

graph.add_conditional_edges(
    START,
    supervisor,
    {
        "researcher": "researcher_node",
        "writer": "writer_node",
        "end": END
    }
)
```

## 🔍 调试

### LangSmith

```python
import os

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-key"
os.environ["LANGCHAIN_PROJECT"] = "project-name"
```

### 可视化

```python
from IPython.display import Image, display

display(Image(app.get_graph().draw_mermaid_png()))
```

## 📝 常用模式

### ReAct Agent

```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(model=llm, tools=tools)
```

### RAG

```python
def retrieve(state):
    docs = vector_store.similarity_search(state["question"])
    return {"documents": docs}

def generate(state):
    context = "\n".join([d.page_content for d in state["documents"]])
    answer = llm.invoke(f"Context: {context}\n\nQuestion: {state['question']}")
    return {"answer": answer.content}

graph.add_node("retrieve", retrieve)
graph.add_node("generate", generate)
graph.add_edge(START, "retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", END)
```

### Plan-and-Execute

```python
def plan(state):
    plan = llm.invoke(f"制定计划: {state['goal']}")
    return {"plan": plan.content.split("\n")}

def execute(state):
    results = [execute_step(step) for step in state["plan"]]
    return {"results": results}

graph.add_edge(START, "plan")
graph.add_edge("plan", "execute")
graph.add_edge("execute", END)
```

## ⚡ 性能优化

### 异步

```python
# 异步调用
result = await app.ainvoke(input_data)

# 异步流式
async for chunk in app.astream(input_data):
    print(chunk)
```

### 批处理

```python
results = app.batch([input1, input2, input3])
```

### 并行执行

```python
from langgraph.types import Send

def parallel(state):
    return [
        Send("task1", data1),
        Send("task2", data2),
    ]
```

## 🎨 LangChain LCEL

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 组合链
chain = prompt | model | output_parser

# 调用
result = chain.invoke({"input": "问题"})

# 流式
for chunk in chain.stream({"input": "问题"}):
    print(chunk, end="", flush=True)
```

## 📚 常用导入

```python
# LangGraph
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Send, RetryPolicy, CachePolicy

# LangChain
from langchain.chat_models import init_chat_model
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# 类型
from typing import Annotated
from typing_extensions import TypedDict
```

## 🔗 资源

- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [LangChain 文档](https://python.langchain.com/)
- [完整指南](./LANGGRAPH_LANGCHAIN_1.0_GUIDE.md)

---

**版本**: LangGraph 0.6.8, LangChain 1.0.0  
**更新**: 2025-01-16

