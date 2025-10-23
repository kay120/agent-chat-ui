# LangChain 与 LangGraph 协作指南

## 🎯 核心理解

### 分工明确

| 框架 | 职责 | 类比 |
|------|------|------|
| **LangChain** | 提供组件和工具 | 工具箱、零件库 |
| **LangGraph** | 编排工作流程 | 流水线、组装图纸 |

### 配合方式

```
LangChain 组件 → 在 LangGraph 节点中使用 → 构建智能体
```

---

## 📦 LangChain 提供的组件

### 1. LLM 模型

```python
from langchain.chat_models import init_chat_model

# 统一接口，支持多种模型
llm = init_chat_model("deepseek:deepseek-chat")
llm = init_chat_model("anthropic:claude-3")
llm = init_chat_model("openai:gpt-4")
```

### 2. 提示词模板

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是{role}"),
    ("human", "{question}")
])
```

### 3. 工具

```python
from langchain_core.tools import tool

@tool
def my_tool(param: str) -> str:
    """工具描述"""
    return result
```

### 4. 向量数据库

```python
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings

vectorstore = Chroma(
    collection_name="docs",
    embedding_function=OpenAIEmbeddings()
)
retriever = vectorstore.as_retriever()
```

### 5. 输出解析器

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

parser = JsonOutputParser()
```

### 6. LCEL 链

```python
# LangChain Expression Language
chain = prompt | llm | output_parser
result = chain.invoke({"question": "..."})
```

---

## 🔄 LangGraph 提供的编排能力

### 1. 状态管理

```python
from langgraph.graph import StateGraph
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[list, add_messages]
    data: dict
```

### 2. 节点定义

```python
def my_node(state: State):
    # 在这里使用 LangChain 组件
    llm = init_chat_model("deepseek:deepseek-chat")
    result = llm.invoke(state["messages"])
    return {"messages": [result]}
```

### 3. 流程控制

```python
workflow = StateGraph(State)
workflow.add_node("node1", node1_func)
workflow.add_node("node2", node2_func)

# 固定边
workflow.add_edge("node1", "node2")

# 条件边
workflow.add_conditional_edges(
    "node1",
    routing_function,
    {"path1": "node2", "path2": "node3"}
)
```

### 4. 持久化

```python
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("memory.db")
app = workflow.compile(checkpointer=checkpointer)
```

---

## 🎨 配合模式

### 模式 1：LangChain 组件作为节点

```python
# LangChain 组件
llm = init_chat_model("deepseek:deepseek-chat")
prompt = ChatPromptTemplate.from_messages([...])

# LangGraph 节点
def llm_node(state):
    chain = prompt | llm
    result = chain.invoke(state)
    return {"output": result.content}

# 添加到工作流
workflow.add_node("llm", llm_node)
```

### 模式 2：LangChain 工具 + LangGraph Agent

```python
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

# LangChain 工具
@tool
def search(query: str) -> str:
    """搜索工具"""
    return "搜索结果..."

# LangGraph Agent（内部使用 LangChain）
agent = create_react_agent(
    model=llm,
    tools=[search]
)
```

### 模式 3：LangChain Retriever + LangGraph 工作流

```python
# LangChain Retriever
retriever = vectorstore.as_retriever()

# LangGraph 节点
def retrieve_node(state):
    docs = retriever.invoke(state["question"])
    return {"documents": docs}

def generate_node(state):
    context = "\n".join([d.page_content for d in state["documents"]])
    chain = prompt | llm
    result = chain.invoke({"context": context, "question": state["question"]})
    return {"answer": result.content}

# 工作流
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.add_edge("retrieve", "generate")
```

---

## 🚀 实战案例

### 案例 1：RAG 系统

**LangChain 提供**：
- Embeddings
- VectorStore
- Retriever
- LLM
- Prompt

**LangGraph 提供**：
- 检索 → 生成的工作流
- 质量评估和重试逻辑
- 状态管理

```python
# 工作流
START → 检索文档 → 生成答案 → 评估质量 → END
                              ↓ (质量不好)
                              ↑____________|
```

### 案例 2：多步骤研究 Agent

**LangChain 提供**：
- LLM（规划、分析、撰写）
- Tools（搜索、数据分析）
- Prompts（不同角色的提示词）

**LangGraph 提供**：
- 规划 → 搜索 → 分析 → 撰写的流程
- 每个步骤的状态传递
- 持久化中间结果

```python
# 工作流
START → 规划 → 搜索 → 分析 → 撰写 → END
```

### 案例 3：多 Agent 客服系统

**LangChain 提供**：
- 不同配置的 LLM（路由、技术、销售）
- Tools（订单查询、产品查询、工单创建）
- Prompts（不同 Agent 的角色设定）

**LangGraph 提供**：
- 路由逻辑
- 多个专业 Agent 的协作
- 对话历史管理

```python
# 工作流
START → 分类器 → 技术 Agent → END
                ↓ 销售 Agent → END
                ↓ 投诉 Agent → END
```

---

## 📊 对比表

| 功能 | LangChain | LangGraph | 配合使用 |
|------|-----------|-----------|---------|
| **LLM 调用** | ✅ 提供接口 | ❌ | LangChain LLM 在 LangGraph 节点中 |
| **提示词** | ✅ 模板系统 | ❌ | LangChain Prompt 在节点中 |
| **工具调用** | ✅ @tool 装饰器 | ✅ ReAct Agent | LangChain 工具 + LangGraph Agent |
| **工作流** | ⚠️ 简单链式 | ✅ 复杂状态机 | LangGraph 编排 LangChain 组件 |
| **状态管理** | ❌ | ✅ StateGraph | LangGraph 管理状态 |
| **持久化** | ⚠️ 简单记忆 | ✅ Checkpointer | LangGraph 持久化 |
| **条件路由** | ❌ | ✅ Conditional Edges | LangGraph 控制流程 |
| **多 Agent** | ❌ | ✅ 原生支持 | LangGraph 编排多个 LangChain Agent |

---

## 🎓 最佳实践

### 1. 职责分离

```python
# ✅ 好的做法
# LangChain 负责"做什么"
llm = init_chat_model("deepseek:deepseek-chat")
tools = [search_tool, calculator_tool]

# LangGraph 负责"怎么做"
workflow = StateGraph(State)
workflow.add_node("think", think_node)
workflow.add_node("act", act_node)
workflow.add_edge("think", "act")
```

### 2. 复用 LangChain 组件

```python
# ✅ 好的做法：定义一次，多处使用
llm = init_chat_model("deepseek:deepseek-chat")

def node1(state):
    return {"output": llm.invoke(state["input"])}

def node2(state):
    return {"output": llm.invoke(state["input"])}
```

### 3. 使用 LCEL 简化节点

```python
# ✅ 好的做法：用 LCEL 组合 LangChain 组件
chain = prompt | llm | output_parser

def node(state):
    result = chain.invoke(state)
    return {"output": result}
```

### 4. 预构建 Agent + 自定义节点

```python
# ✅ 好的做法：结合预构建和自定义
from langgraph.prebuilt import create_react_agent

# 使用预构建 Agent
agent = create_react_agent(model=llm, tools=tools)

# 添加自定义前后处理
workflow.add_node("preprocess", preprocess_node)
workflow.add_node("agent", agent)
workflow.add_node("postprocess", postprocess_node)
```

---

## 🔧 实用技巧

### 技巧 1：在节点中动态选择 LLM

```python
def smart_node(state):
    # 根据任务复杂度选择不同的 LLM
    if state["complexity"] == "high":
        llm = init_chat_model("openai:gpt-4")
    else:
        llm = init_chat_model("deepseek:deepseek-chat")
    
    result = llm.invoke(state["messages"])
    return {"messages": [result]}
```

### 技巧 2：在节点中使用多个 LangChain 组件

```python
def rag_node(state):
    # 1. 检索（LangChain Retriever）
    docs = retriever.invoke(state["question"])
    
    # 2. 重排序（LangChain Reranker）
    reranked = reranker.compress_documents(docs, state["question"])
    
    # 3. 生成（LangChain LLM）
    context = "\n".join([d.page_content for d in reranked])
    chain = prompt | llm
    result = chain.invoke({"context": context, "question": state["question"]})
    
    return {"answer": result.content}
```

### 技巧 3：流式输出

```python
async def streaming_node(state):
    """在 LangGraph 节点中使用 LangChain 的流式输出"""
    llm = init_chat_model("deepseek:deepseek-chat")
    
    full_response = ""
    async for chunk in llm.astream(state["messages"]):
        full_response += chunk.content
        # 可以在这里发送中间结果
    
    return {"messages": [AIMessage(content=full_response)]}
```

---

## 📚 学习路径

### 第 1 步：掌握 LangChain 基础
- LLM 调用
- Prompt 模板
- 工具定义
- LCEL 链式调用

### 第 2 步：掌握 LangGraph 基础
- StateGraph
- 节点和边
- 条件路由
- Checkpointer

### 第 3 步：学习配合使用
- 在节点中使用 LangChain 组件
- 使用预构建 Agent
- 构建复杂工作流

### 第 4 步：实战项目
- RAG 系统
- 多步骤 Agent
- 多 Agent 协作

---

## 🔗 相关资源

- [完整示例代码](../../examples/intelligent_customer_service.py)
- [LangGraph 完整指南](./LANGGRAPH_LANGCHAIN_1.0_GUIDE.md)
- [快速参考](./LANGGRAPH_QUICK_REFERENCE.md)
- [代码改进指南](./CODE_IMPROVEMENT_GUIDE.md)

---

**版本**: v1.0.0  
**更新**: 2025-01-16

