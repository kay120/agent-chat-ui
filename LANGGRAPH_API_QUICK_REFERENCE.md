# 🚀 LangGraph API 快速参考

## 📋 **常用命令**

```bash
# 启动开发服务器
langgraph dev --port 2024

# 生成 Dockerfile
langgraph dockerfile

# 部署到云端
langgraph deploy

# 查看帮助
langgraph --help
```

---

## 🌐 **常用 API 端点**

### Assistants（助手）

```bash
GET    /assistants                    # 列出所有助手
GET    /assistants/{id}               # 获取助手详情
POST   /assistants                    # 创建助手
PATCH  /assistants/{id}               # 更新助手
DELETE /assistants/{id}               # 删除助手
```

### Threads（线程/对话）

```bash
GET    /threads                       # 列出线程
POST   /threads                       # 创建线程
GET    /threads/{thread_id}           # 获取线程详情
PATCH  /threads/{thread_id}           # 更新线程
DELETE /threads/{thread_id}           # 删除线程
GET    /threads/{thread_id}/state     # 获取状态
POST   /threads/{thread_id}/state     # 更新状态
```

### Runs（运行）

```bash
POST   /threads/{thread_id}/runs/stream    # 流式运行 ⭐
POST   /threads/{thread_id}/runs           # 创建运行
GET    /threads/{thread_id}/runs           # 获取运行列表
GET    /threads/{thread_id}/runs/{run_id}  # 获取运行详情
POST   /threads/{thread_id}/runs/{run_id}/cancel # 取消运行
```

### Crons（定时任务）

```bash
POST   /crons                         # 创建定时任务
GET    /crons                         # 列出定时任务
DELETE /crons/{cron_id}               # 删除定时任务
```

### Store（存储）

```bash
POST   /store/items                   # 存储数据
GET    /store/items                   # 列出数据
PUT    /store/items                   # 更新数据
DELETE /store/items                   # 删除数据
POST   /store/items/search            # 搜索数据
```

---

## 📝 **请求示例**

### 1. 创建线程

```bash
curl -X POST http://localhost:2024/threads \
  -H "Content-Type: application/json" \
  -d '{}'
```

**响应**:
```json
{
  "thread_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-10-01T13:00:00Z",
  "metadata": {}
}
```

---

### 2. 流式运行（最常用）⭐

```bash
curl -X POST http://localhost:2024/threads/{thread_id}/runs/stream \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "agent",
    "input": {
      "messages": [
        {"type": "human", "content": "你好"}
      ]
    }
  }'
```

**响应**（SSE 格式）:
```
data: {"event": "metadata", "data": {"run_id": "..."}}
data: {"event": "values", "data": {"messages": [...]}}
data: {"event": "end", "data": null}
```

---

### 3. 获取线程状态

```bash
curl http://localhost:2024/threads/{thread_id}/state
```

**响应**:
```json
{
  "values": {
    "messages": [
      {"type": "human", "content": "你好"},
      {"type": "ai", "content": "你好！很高兴见到你！"}
    ]
  },
  "next": [],
  "checkpoint": {...}
}
```

---

### 4. 创建定时任务

```bash
curl -X POST http://localhost:2024/crons \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 9 * * *",
    "assistant_id": "agent",
    "input": {
      "messages": [
        {"type": "human", "content": "早安"}
      ]
    }
  }'
```

---

### 5. 存储数据

```bash
curl -X POST http://localhost:2024/store/items \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": ["user", "123"],
    "key": "preferences",
    "value": {"theme": "dark", "language": "zh"}
  }'
```

---

### 6. 搜索数据（语义搜索）

```bash
curl -X POST http://localhost:2024/store/items/search \
  -H "Content-Type: application/json" \
  -d '{
    "namespace_prefix": ["user"],
    "query": "用户偏好设置",
    "limit": 10
  }'
```

---

## 📁 **文件结构**

### 最小项目结构

```
my-agent/
├── graph.py              # 图定义
├── langgraph.json        # 配置文件
└── .env                  # 环境变量
```

### `graph.py` 模板

```python
from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, START, END, add_messages
from langchain_openai import ChatOpenAI

# 定义状态
class State(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# 初始化 LLM
llm = ChatOpenAI(model="gpt-4")

# 定义节点
def chatbot(state: State) -> State:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

# 创建图
workflow = StateGraph(State)
workflow.add_node("chatbot", chatbot)
workflow.set_entry_point("chatbot")
workflow.add_edge("chatbot", END)

# 导出图（不要提供 checkpointer）
graph = workflow.compile()
```

### `langgraph.json` 模板

```json
{
  "$schema": "https://langgra.ph/schema.json",
  "python_version": "3.11",
  "dependencies": ["langchain-openai"],
  "graphs": {
    "agent": "./graph.py:graph"
  },
  "env": ".env"
}
```

### `.env` 模板

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# DeepSeek
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com

# LangSmith（可选）
LANGSMITH_API_KEY=...
LANGSMITH_TRACING=true
```

---

## 🔧 **配置选项**

### `langgraph.json` 完整示例

```json
{
  "$schema": "https://langgra.ph/schema.json",
  
  "python_version": "3.13",
  "node_version": "20",
  
  "dependencies": [
    "langchain-openai",
    "langchain-anthropic",
    "."
  ],
  
  "graphs": {
    "agent": "./graph.py:graph",
    "chatbot": "./chatbot.py:graph"
  },
  
  "env": ".env",
  
  "store": {
    "index": {
      "dims": 1536,
      "embed": "openai:text-embedding-3-small",
      "fields": ["title", "content"]
    },
    "ttl": {
      "default_ttl": 1440,
      "sweep_interval_minutes": 60,
      "refresh_on_read": true
    }
  },
  
  "http": {
    "app": "./custom_app.py:app"
  }
}
```

---

## 🌐 **环境变量**

```bash
# 服务器配置
PORT=2024
HOST=0.0.0.0

# 数据库（生产环境）
POSTGRES_URI=postgresql://user:pass@localhost/db

# 认证
LANGSMITH_API_KEY=your_key

# CORS
CORS_ALLOW_ORIGINS=["http://localhost:3000"]

# 日志
LOG_LEVEL=INFO

# 功能开关
ALLOW_PRIVATE_NETWORK=true
DISABLE_TRUSTSTORE=false
```

---

## 🎨 **访问地址**

| 服务 | 地址 |
|------|------|
| **API** | http://127.0.0.1:2024 |
| **API 文档** | http://127.0.0.1:2024/docs |
| **健康检查** | http://127.0.0.1:2024/ok |
| **Studio UI** | https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024 |

---

## 🐛 **常见问题**

### 1. 导入错误

**问题**: `ImportError: attempted relative import with no known parent package`

**解决**: 不要在 `graph.py` 中使用相对导入

```python
# ❌ 错误
from ..models.state import State

# ✅ 正确
from typing_extensions import TypedDict
class State(TypedDict):
    messages: list
```

---

### 2. Checkpointer 错误

**问题**: `ValueError: Your graph includes a custom checkpointer`

**解决**: 不要在 `compile()` 中提供 checkpointer

```python
# ❌ 错误
graph = workflow.compile(checkpointer=MemorySaver())

# ✅ 正确
graph = workflow.compile()
```

---

### 3. 端口被占用

**问题**: `Address already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -i :2024

# 杀死进程
kill -9 <PID>

# 或使用其他端口
langgraph dev --port 8080
```

---

## 📊 **性能优化**

### 1. 使用 PostgreSQL（生产环境）

```bash
export POSTGRES_URI=postgresql://user:pass@localhost/langgraph
```

### 2. 启用连接池

```python
# 自动启用，无需配置
```

### 3. 批量处理

```bash
POST /runs/batch
```

---

## 🔒 **安全配置**

### 1. 启用认证

```bash
export LANGSMITH_API_KEY=your_key
```

### 2. 限制 CORS

```bash
export CORS_ALLOW_ORIGINS='["https://yourdomain.com"]'
```

### 3. 私有网络

```bash
export ALLOW_PRIVATE_NETWORK=false
```

---

## 📚 **学习路径**

### 初级
1. ✅ 启动开发服务器
2. ✅ 创建简单的图
3. ✅ 测试流式输出
4. ✅ 查看 API 文档

### 中级
1. ✅ 使用 Store 存储数据
2. ✅ 创建定时任务
3. ✅ 自定义认证
4. ✅ 部署到 Docker

### 高级
1. ✅ 多 Agent 系统（A2A）
2. ✅ 自定义中间件
3. ✅ 修改源码
4. ✅ 生产环境部署

---

## 🎯 **快速测试**

```bash
# 1. 检查服务器状态
curl http://localhost:2024/ok

# 2. 列出助手
curl http://localhost:2024/assistants

# 3. 创建线程
curl -X POST http://localhost:2024/threads

# 4. 流式运行
curl -X POST http://localhost:2024/threads/{thread_id}/runs/stream \
  -H "Content-Type: application/json" \
  -d '{"assistant_id": "agent", "input": {"messages": [{"type": "human", "content": "你好"}]}}'
```

---

## 📖 **资源链接**

- **官方文档**: https://langchain-ai.github.io/langgraph/cloud/
- **API 参考**: http://127.0.0.1:2024/docs
- **GitHub**: https://github.com/langchain-ai/langgraph
- **Discord**: https://discord.gg/langchain

---

**快速上手，功能强大！** 🚀

