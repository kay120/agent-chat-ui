# 代码改进指南

## 📋 概述

本文档对比当前实现和改进版本，帮助你理解 LangGraph 的最佳实践。

---

## 🔍 当前实现 vs 改进版本

### 1. Checkpointer 管理

#### ❌ 当前实现

```python
# graph_service.py
def _create_graph(self):
    memory = MemorySaver()  # 使用内存存储
    graph = workflow.compile(checkpointer=memory)
    return graph

# 然后手动管理数据库
def stream_response(self, input_messages, thread_id):
    # 手动从数据库加载历史
    thread = thread_service.get_thread(thread_id)
    messages = []
    for msg in thread["messages"]:
        if msg["type"] == "human":
            messages.append(HumanMessage(...))
    
    # 手动保存消息
    thread_service.save_message(thread_id, msg_id, "human", content)
```

**问题**：
- Graph 使用内存存储（重启丢失）
- 手动管理数据库（代码冗余）
- 两套存储系统（不一致）

#### ✅ 改进版本

```python
# graph_service_improved.py
def _create_graph(self):
    # 使用 SQLite checkpointer
    checkpointer = SqliteSaver.from_conn_string("checkpoints.db")
    
    graph = create_react_agent(
        model=llm,
        tools=self.tools,
        checkpointer=checkpointer  # LangGraph 自动管理
    )
    return graph

# 不需要手动管理历史！
def stream_response(self, input_messages, thread_id):
    config = {"configurable": {"thread_id": thread_id}}
    
    # LangGraph 自动加载历史、保存新消息
    async for event in self.graph.astream_events(
        {"messages": input_messages},
        config=config,
        version="v2"
    ):
        ...
```

**优势**：
- ✅ 统一的存储系统
- ✅ 自动管理历史
- ✅ 代码更简洁
- ✅ 重启后数据不丢失

---

### 2. 流式处理

#### ❌ 当前实现

```python
# 绕过 Graph，直接调用 LLM
async for chunk in llm.astream(messages):
    if hasattr(chunk, 'content') and chunk.content:
        content = str(chunk.content)
        ai_response_content += content
        
        # 手动发送 SSE
        yield f"event: messages/partial\n"
        yield f"data: {json.dumps([...])}\n\n"

# 手动保存到数据库
thread_service.save_message(thread_id, ai_msg_id, "ai", ai_response_content)
```

**问题**：
- 没有使用 Graph 的流式功能
- 无法支持工具调用
- 手动管理状态

#### ✅ 改进版本

```python
# 使用 Graph 的原生流式 API
async for event in self.graph.astream_events(
    {"messages": input_messages},
    config=config,
    version="v2"
):
    kind = event["event"]
    
    # LLM 输出
    if kind == "on_chat_model_stream":
        chunk = event["data"]["chunk"]
        if chunk.content:
            yield f"event: message\n"
            yield f"data: {json.dumps({'content': chunk.content})}\n\n"
    
    # 工具调用（自动支持！）
    elif kind == "on_tool_start":
        tool_name = event.get("name")
        yield f"event: tool_start\n"
        yield f"data: {json.dumps({'tool': tool_name})}\n\n"
    
    elif kind == "on_tool_end":
        tool_output = event["data"]["output"]
        yield f"event: tool_end\n"
        yield f"data: {json.dumps({'output': tool_output})}\n\n"
```

**优势**：
- ✅ 使用 Graph 的完整功能
- ✅ 自动支持工具调用
- ✅ 自动保存状态
- ✅ 更丰富的事件类型

---

### 3. Agent 架构

#### ❌ 当前实现

```python
# 简单的线性流程
workflow = StateGraph(State)
workflow.add_node("chatbot", self._chatbot_node)
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# 只能聊天，不能调用工具
def _chatbot_node(self, state, config):
    llm = llm_service.get_llm()
    response = llm.invoke(state["messages"])
    return {"messages": [response]}
```

**限制**：
- 只能聊天
- 不能调用工具
- 不能多步骤推理

#### ✅ 改进版本

```python
# 使用预构建的 ReAct Agent
graph = create_react_agent(
    model=llm,
    tools=[get_current_time, calculator, search_web],
    checkpointer=checkpointer
)
```

**ReAct Agent 的工作流程**：

```
用户问题: "现在几点？帮我算 2+2"
    ↓
Agent 思考: 需要调用 get_current_time 和 calculator
    ↓
调用工具 1: get_current_time()
    ↓
结果: "2025-01-16 15:30:00"
    ↓
调用工具 2: calculator("2+2")
    ↓
结果: "计算结果: 4"
    ↓
Agent 整合: "现在是 2025-01-16 15:30:00，2+2 等于 4"
```

**优势**：
- ✅ 自动工具调用
- ✅ 多步骤推理
- ✅ 更智能的对话

---

## 🚀 迁移步骤

### 步骤 1：备份当前代码

```bash
cp backend/services/graph_service.py backend/services/graph_service_old.py
```

### 步骤 2：安装依赖

```bash
pip install langgraph-checkpoint-sqlite
```

### 步骤 3：创建工具文件

创建 `backend/tools/__init__.py`：

```python
from langchain_core.tools import tool

@tool
def get_current_time() -> str:
    """获取当前时间"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

@tool
def calculator(expression: str) -> str:
    """计算数学表达式"""
    try:
        return f"结果: {eval(expression)}"
    except Exception as e:
        return f"错误: {e}"

# 导出
__all__ = ["get_current_time", "calculator"]
```

### 步骤 4：更新 GraphService

替换 `backend/services/graph_service.py` 的内容为改进版本。

### 步骤 5：更新路由（如果需要）

`backend/api/routes.py` 应该不需要改动，因为接口保持一致。

### 步骤 6：测试

```bash
# 启动服务
./start.sh

# 测试基本对话
curl -X POST http://localhost:2024/threads/123/runs/stream \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "你好"}]}'

# 测试工具调用
curl -X POST http://localhost:2024/threads/123/runs/stream \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "现在几点？"}]}'
```

---

## 📊 功能对比表

| 功能 | 当前实现 | 改进版本 |
|------|---------|---------|
| **持久化** | 手动管理 SQLite | LangGraph 自动管理 |
| **对话历史** | 手动加载/保存 | 自动加载/保存 |
| **流式输出** | 直接调用 LLM | 使用 Graph API |
| **工具调用** | ❌ 不支持 | ✅ 支持 |
| **多步推理** | ❌ 不支持 | ✅ 支持 |
| **代码复杂度** | 高（190 行） | 低（180 行，功能更多） |
| **可扩展性** | 低 | 高 |
| **调试** | 困难 | 容易（LangSmith） |

---

## 🎯 实际效果对比

### 当前实现

**用户**: "现在几点？"

**回复**: "抱歉，我无法获取当前时间。"

**原因**: 没有工具调用能力

### 改进版本

**用户**: "现在几点？"

**Agent 思考**:
```
1. 用户问时间
2. 我有 get_current_time 工具
3. 调用工具
4. 返回结果
```

**回复**: "现在是 2025-01-16 15:30:00"

---

## 🔧 高级功能示例

### 添加搜索工具

```python
@tool
def search_web(query: str) -> str:
    """搜索互联网"""
    # 接入真实搜索 API
    import requests
    response = requests.get(f"https://api.search.com?q={query}")
    return response.json()["results"]
```

### 添加数据库查询工具

```python
@tool
def query_database(sql: str) -> str:
    """查询数据库"""
    import sqlite3
    conn = sqlite3.connect("data.db")
    cursor = conn.execute(sql)
    results = cursor.fetchall()
    return str(results)
```

### 添加文件操作工具

```python
@tool
def read_file(filepath: str) -> str:
    """读取文件内容"""
    with open(filepath, 'r') as f:
        return f.read()

@tool
def write_file(filepath: str, content: str) -> str:
    """写入文件"""
    with open(filepath, 'w') as f:
        f.write(content)
    return f"已写入 {filepath}"
```

---

## 📝 最佳实践

### 1. 工具设计

```python
@tool
def good_tool(param: str) -> str:
    """
    清晰的描述，告诉 LLM 这个工具做什么
    
    Args:
        param: 参数说明
        
    Returns:
        返回值说明
    """
    # 实现
    return result
```

### 2. 错误处理

```python
@tool
def safe_tool(param: str) -> str:
    """安全的工具调用"""
    try:
        result = risky_operation(param)
        return f"成功: {result}"
    except Exception as e:
        return f"错误: {e}"
```

### 3. 日志记录

```python
async def stream_response(self, input_messages, thread_id):
    print(f"🚀 开始处理: thread_id={thread_id}")
    
    async for event in self.graph.astream_events(...):
        if event["event"] == "on_tool_start":
            print(f"🔧 调用工具: {event['name']}")
        elif event["event"] == "on_tool_end":
            print(f"✅ 工具完成: {event['name']}")
```

---

## 🎓 学习建议

1. **先理解概念**：
   - 阅读 [LangGraph 完整指南](./LANGGRAPH_LANGCHAIN_1.0_GUIDE.md)
   - 理解 State、Node、Edge 的概念

2. **小步迁移**：
   - 先迁移 Checkpointer
   - 再迁移流式处理
   - 最后添加工具

3. **充分测试**：
   - 测试基本对话
   - 测试工具调用
   - 测试错误处理

4. **监控和调试**：
   - 使用 LangSmith
   - 查看日志
   - 分析性能

---

## 🔗 相关资源

- [改进版代码](../backend/services/graph_service_improved.py)
- [LangGraph 完整指南](./LANGGRAPH_LANGCHAIN_1.0_GUIDE.md)
- [快速参考](./LANGGRAPH_QUICK_REFERENCE.md)

---

**版本**: v1.0.0  
**更新**: 2025-01-16

