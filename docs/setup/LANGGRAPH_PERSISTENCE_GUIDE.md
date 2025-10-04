# 🗄️ LangGraph 持久化存储完整指南

**日期**: 2025-10-02  
**目标**: 实现文件持久化记忆功能

---

## 📊 LangGraph 持久化方案概览

LangGraph 提供了**多种持久化存储方案**，从内存到数据库都有支持：

| 存储方案 | 类型 | 适用场景 | 持久化 | 性能 |
|---------|------|---------|--------|------|
| **InMemorySaver** | 内存 | 开发、测试 | ❌ 重启丢失 | ⚡ 最快 |
| **SqliteSaver** | SQLite | 小型应用、单机 | ✅ 文件持久化 | 🚀 快 |
| **PostgresSaver** | PostgreSQL | 生产环境、多用户 | ✅ 数据库持久化 | 💪 强大 |
| **AsyncSqliteSaver** | SQLite (异步) | 异步应用 | ✅ 文件持久化 | 🚀 快 |
| **AsyncPostgresSaver** | PostgreSQL (异步) | 生产环境 (异步) | ✅ 数据库持久化 | 💪 强大 |

---

## 🎯 当前使用的方案

**你的项目当前使用**: `MemorySaver` (内存存储)

<augment_code_snippet path="agent-chat-ui/graph.py" mode="EXCERPT">
```python
from langgraph.checkpoint.memory import MemorySaver

# 创建图
memory = MemorySaver()
graph = workflow.compile(checkpointer=memory)
```
</augment_code_snippet>

**问题**:
- ❌ 重启后所有对话历史丢失
- ❌ 无法跨会话保存用户数据
- ❌ 不适合生产环境

---

## ✅ 推荐方案：SQLite 持久化

### 为什么选择 SQLite？

✅ **文件持久化**: 数据保存在 `.sqlite` 文件中，重启不丢失  
✅ **零配置**: 无需安装数据库服务器  
✅ **轻量级**: 适合中小型应用  
✅ **易于备份**: 直接复制 `.sqlite` 文件即可  
✅ **跨平台**: 支持 Windows、macOS、Linux  

---

## 🔧 实现 SQLite 持久化

### 方案 1: 同步版本（推荐）

**安装依赖**:
```bash
pip install langgraph-checkpoint-sqlite
```

**修改 `graph.py`**:

```python
import sqlite3
from langgraph.checkpoint.sqlite import SqliteSaver

# 创建 SQLite 连接
# check_same_thread=False 允许多线程访问（SqliteSaver 内部有锁保证线程安全）
conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)

# 创建 checkpointer
memory = SqliteSaver(conn)

# 编译图
graph = workflow.compile(checkpointer=memory)

print("✅ 已启用 SQLite 持久化存储")
print(f"   - 数据库文件: checkpoints.sqlite")
```

**完整示例**:

```python
"""
LangGraph 图定义 - 使用 SQLite 持久化
"""
import os
import sqlite3
from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.sqlite import SqliteSaver  # 使用 SQLite
from langchain_openai import ChatOpenAI


# 定义状态
class State(TypedDict):
    """对话状态"""
    messages: Annotated[list[BaseMessage], add_messages]


# 初始化 LLM
def get_llm():
    """获取 LLM 实例（从环境变量读取配置）"""
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
    
    # 打印最新的用户消息
    if state['messages']:
        last_message = state['messages'][-1]
        if isinstance(last_message, HumanMessage):
            print(f"👤 用户消息: {last_message.content}")
    
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
    
    # 创建 AIMessage 对象
    ai_message = AIMessage(content=full_content)
    
    # 打印 AI 回复预览
    preview = full_content[:100] + "..." if len(full_content) > 100 else full_content
    print(f"🤖 AI 回复预览: {preview}")
    
    return {"messages": [ai_message]}


# 构建图
workflow = StateGraph(State)
workflow.add_node("chatbot", chatbot)
workflow.add_edge(START, "chatbot")
workflow.add_edge("chatbot", END)

# 🗄️ 使用 SQLite 持久化存储
db_path = os.getenv("SQLITE_DB_PATH", "checkpoints.sqlite")
conn = sqlite3.connect(db_path, check_same_thread=False)
memory = SqliteSaver(conn)

# 编译图
graph = workflow.compile(checkpointer=memory)

print("✅ 已启用 SQLite 持久化存储")
print(f"   - 数据库文件: {db_path}")
print(f"   - 重启后对话历史不会丢失")
```

---

### 方案 2: 异步版本

**安装依赖**:
```bash
pip install aiosqlite langgraph-checkpoint-sqlite
```

**修改 `graph.py`**:

```python
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

# 创建异步 checkpointer
async def create_checkpointer():
    memory = AsyncSqliteSaver.from_conn_string("checkpoints.sqlite")
    await memory.setup()  # 初始化数据库表
    return memory

# 使用
memory = await create_checkpointer()
graph = workflow.compile(checkpointer=memory)
```

---

## 🚀 升级到 PostgreSQL（生产环境）

### 为什么升级到 PostgreSQL？

✅ **多用户支持**: 支持并发访问  
✅ **高性能**: 适合大规模应用  
✅ **高可用**: 支持主从复制、故障转移  
✅ **云原生**: 易于部署到云平台  

### 实现步骤

**1. 安装依赖**:
```bash
pip install "psycopg[binary,pool]" langgraph-checkpoint-postgres
```

**2. 启动 PostgreSQL**:

使用 Docker:
```bash
docker run -d \
  --name langgraph-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=langgraph \
  -p 5432:5432 \
  postgres:16
```

**3. 修改 `graph.py`**:

```python
from langgraph.checkpoint.postgres import PostgresSaver

# PostgreSQL 连接字符串
DB_URI = os.getenv(
    "POSTGRES_URI",
    "postgresql://postgres:postgres@localhost:5432/langgraph"
)

# 创建 checkpointer
with PostgresSaver.from_conn_string(DB_URI) as memory:
    # 首次使用需要初始化表
    # memory.setup()
    
    graph = workflow.compile(checkpointer=memory)
    
    print("✅ 已启用 PostgreSQL 持久化存储")
    print(f"   - 数据库: {DB_URI}")
```

**4. 添加到 `.env`**:

```bash
# PostgreSQL 配置（可选，用于生产环境）
POSTGRES_URI=postgresql://postgres:postgres@localhost:5432/langgraph
```

---

## 📋 配置对比

| 配置项 | InMemorySaver | SqliteSaver | PostgresSaver |
|--------|--------------|-------------|---------------|
| **安装** | 内置 | `pip install langgraph-checkpoint-sqlite` | `pip install langgraph-checkpoint-postgres` |
| **配置复杂度** | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐⭐ 复杂 |
| **持久化** | ❌ 否 | ✅ 是 | ✅ 是 |
| **并发支持** | ❌ 单线程 | ⚠️ 有限 | ✅ 完全支持 |
| **适用场景** | 开发测试 | 小型应用 | 生产环境 |
| **数据备份** | ❌ 不支持 | ✅ 复制文件 | ✅ 数据库备份 |

---

## 🎯 推荐实施步骤

### 第一步：立即升级到 SQLite ✅

**优先级**: 🔥 高  
**难度**: ⭐ 简单  
**收益**: 解决重启丢失数据的问题

```bash
# 1. 安装依赖
pip install langgraph-checkpoint-sqlite

# 2. 修改 graph.py（见上面的完整示例）

# 3. 重启服务
langgraph dev
```

### 第二步：添加环境变量配置

在 `.env` 中添加：

```bash
# SQLite 持久化配置
SQLITE_DB_PATH=checkpoints.sqlite
```

### 第三步：测试持久化

```bash
# 1. 启动服务
langgraph dev

# 2. 在浏览器中发送消息

# 3. 重启服务
# Ctrl+C 停止
langgraph dev

# 4. 刷新浏览器，检查历史消息是否还在
```

### 第四步：（可选）升级到 PostgreSQL

当应用规模扩大时，再考虑升级到 PostgreSQL。

---

## 📊 数据库文件说明

### SQLite 数据库结构

**文件位置**: `checkpoints.sqlite`

**表结构**:
- `checkpoints`: 存储对话检查点
- `writes`: 存储写入操作

**查看数据**:
```bash
# 使用 SQLite 命令行工具
sqlite3 checkpoints.sqlite

# 查看表
.tables

# 查看检查点
SELECT * FROM checkpoints LIMIT 10;

# 退出
.quit
```

---

## 🔒 安全最佳实践

### 1. 保护数据库文件

**`.gitignore`**:
```
# SQLite 数据库文件
*.sqlite
*.sqlite3
*.db

# PostgreSQL 备份
*.sql
*.dump
```

### 2. 定期备份

**SQLite 备份**:
```bash
# 复制文件
cp checkpoints.sqlite checkpoints.backup.sqlite

# 或使用 SQLite 备份命令
sqlite3 checkpoints.sqlite ".backup checkpoints.backup.sqlite"
```

**PostgreSQL 备份**:
```bash
# 导出数据
pg_dump -U postgres langgraph > backup.sql

# 恢复数据
psql -U postgres langgraph < backup.sql
```

---

## 🎉 总结

### 推荐方案

**当前阶段**: 使用 **SqliteSaver**

**优势**:
- ✅ 文件持久化，重启不丢失
- ✅ 零配置，开箱即用
- ✅ 易于备份和迁移
- ✅ 适合中小型应用

**实施步骤**:
1. 安装 `langgraph-checkpoint-sqlite`
2. 修改 `graph.py` 使用 `SqliteSaver`
3. 添加 `.env` 配置
4. 测试持久化功能

**未来升级路径**:
- 当用户量增加时 → 升级到 PostgreSQL
- 当需要分布式部署时 → 使用云数据库

---

**文档创建时间**: 2025-10-02  
**推荐方案**: ✅ **SqliteSaver**  
**下一步**: 修改 `graph.py` 实现持久化

