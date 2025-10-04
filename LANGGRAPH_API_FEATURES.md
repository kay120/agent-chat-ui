# 📚 LangGraph API 完整功能指南

## 🎯 **什么是 LangGraph API？**

**LangGraph API** (`langgraph_api`) 是 LangChain 官方提供的企业级 API 服务器，用于部署和管理 LangGraph 应用。

- **包名**: `langgraph-api`
- **版本**: 0.4.31
- **类型**: 开源（可修改）
- **用途**: 本地开发、测试、生产部署

---

## 🏗️ **核心架构**

### 源码结构

```
langgraph_api/
├── server.py              # FastAPI 应用入口
├── config.py              # 配置管理
├── api/                   # API 路由
│   ├── assistants.py      # 助手管理
│   ├── threads.py         # 线程（对话）管理
│   ├── runs.py            # 运行管理
│   ├── store.py           # 长期记忆存储
│   ├── a2a.py             # Agent-to-Agent 通信
│   └── mcp.py             # Model Context Protocol
├── auth/                  # 认证授权
│   ├── noop.py            # 无认证（开发模式）
│   ├── custom.py          # 自定义认证
│   └── langsmith/         # LangSmith 认证
├── middleware/            # 中间件
│   ├── http_logger.py     # HTTP 日志
│   ├── request_id.py      # 请求 ID
│   └── private_network.py # 私有网络
├── grpc_ops/              # gRPC 操作
├── js/                    # JavaScript 支持
└── utils/                 # 工具函数
```

---

## 🚀 **核心功能模块**

### 1. **Assistants（助手管理）**

**文件**: `api/assistants.py`

**功能**:
- ✅ 创建助手（图定义）
- ✅ 列出所有助手
- ✅ 搜索助手
- ✅ 获取助手详情
- ✅ 更新助手配置
- ✅ 删除助手
- ✅ 版本管理

**API 端点**:
```bash
GET    /assistants              # 列出助手
POST   /assistants/search       # 搜索助手
GET    /assistants/{id}         # 获取助手详情
POST   /assistants              # 创建助手
PATCH  /assistants/{id}         # 更新助手
DELETE /assistants/{id}         # 删除助手
GET    /assistants/{id}/versions # 获取版本历史
```

**示例**:
```bash
# 列出所有助手
curl http://localhost:2024/assistants

# 获取助手详情
curl http://localhost:2024/assistants/agent
```

---

### 2. **Threads（线程/对话管理）**

**文件**: `api/threads.py`

**功能**:
- ✅ 创建对话线程
- ✅ 获取线程状态
- ✅ 更新线程状态
- ✅ 删除线程
- ✅ 获取线程历史
- ✅ 搜索线程

**API 端点**:
```bash
GET    /threads                 # 列出线程
POST   /threads                 # 创建线程
GET    /threads/{thread_id}     # 获取线程详情
PATCH  /threads/{thread_id}     # 更新线程
DELETE /threads/{thread_id}     # 删除线程
POST   /threads/search          # 搜索线程
GET    /threads/{thread_id}/state # 获取线程状态
POST   /threads/{thread_id}/state # 更新线程状态
```

**特性**:
- 🔄 自动持久化对话状态
- 📊 支持检查点（Checkpoint）
- 🔍 支持状态查询和修改
- ⏰ 支持 TTL（自动过期）

---

### 3. **Runs（运行管理）**

**文件**: `api/runs.py`

**功能**:
- ✅ 创建运行（执行图）
- ✅ 流式输出
- ✅ 批量运行
- ✅ 取消运行
- ✅ 获取运行状态
- ✅ 运行历史

**API 端点**:
```bash
POST   /threads/{thread_id}/runs/stream    # 流式运行
POST   /threads/{thread_id}/runs           # 创建运行
GET    /threads/{thread_id}/runs           # 获取运行列表
GET    /threads/{thread_id}/runs/{run_id}  # 获取运行详情
POST   /threads/{thread_id}/runs/{run_id}/cancel # 取消运行
POST   /runs/batch                          # 批量运行
```

**流式输出格式**:
```
data: {"event": "metadata", "data": {...}}
data: {"event": "values", "data": {"messages": [...]}}
data: {"event": "end", "data": null}
```

---

### 4. **Crons（定时任务）**

**文件**: `api/runs.py`

**功能**:
- ✅ 创建定时任务
- ✅ 列出定时任务
- ✅ 删除定时任务
- ✅ 支持 cron 表达式

**API 端点**:
```bash
POST   /crons                   # 创建定时任务
GET    /crons                   # 列出定时任务
DELETE /crons/{cron_id}         # 删除定时任务
POST   /crons/search            # 搜索定时任务
```

**示例**:
```json
{
  "schedule": "0 9 * * *",  // 每天早上 9 点
  "assistant_id": "agent",
  "input": {"messages": [{"type": "human", "content": "早安"}]}
}
```

---

### 5. **Store（长期记忆存储）**

**文件**: `api/store.py`

**功能**:
- ✅ 存储和检索数据
- ✅ 向量搜索（语义搜索）
- ✅ 命名空间隔离
- ✅ TTL 支持
- ✅ 批量操作

**API 端点**:
```bash
POST   /store/items             # 存储数据
GET    /store/items             # 列出数据
PUT    /store/items             # 更新数据
DELETE /store/items             # 删除数据
POST   /store/items/search      # 搜索数据
```

**配置**（`langgraph.json`）:
```json
{
  "store": {
    "index": {
      "dims": 1536,
      "embed": "openai:text-embedding-3-small",
      "fields": ["title", "content"]
    },
    "ttl": {
      "default_ttl": 1440,  // 24 小时
      "sweep_interval_minutes": 60
    }
  }
}
```

---

### 6. **Agent-to-Agent (A2A) 通信**

**文件**: `api/a2a.py`

**功能**:
- ✅ 多个 Agent 之间通信
- ✅ 消息路由
- ✅ 事件订阅
- ✅ 异步通信

**用途**:
- 构建多 Agent 系统
- Agent 协作
- 分布式 AI 应用

---

### 7. **Model Context Protocol (MCP)**

**文件**: `api/mcp.py`

**功能**:
- ✅ 标准化的上下文协议
- ✅ 工具调用
- ✅ 资源访问
- ✅ 提示词管理

**用途**:
- 与外部工具集成
- 标准化 AI 应用接口

---

### 8. **认证和授权**

**文件**: `auth/`

**支持的认证方式**:

#### a) **无认证（开发模式）**
```python
# auth/noop.py
# 默认模式，不需要认证
```

#### b) **自定义认证**
```python
# auth/custom.py
# 可以实现自己的认证逻辑
```

#### c) **LangSmith 认证**
```python
# auth/langsmith/
# 与 LangSmith 平台集成
```

**配置**:
```bash
# .env
LANGSMITH_API_KEY=your_api_key
```

---

### 9. **中间件系统**

**文件**: `middleware/`

#### a) **HTTP 日志**
```python
# middleware/http_logger.py
# 记录所有 HTTP 请求和响应
```

#### b) **请求 ID**
```python
# middleware/request_id.py
# 为每个请求生成唯一 ID
```

#### c) **私有网络**
```python
# middleware/private_network.py
# 限制访问来源
```

#### d) **CORS**
```python
# 跨域资源共享
allow_origins = ["http://localhost:3000"]
```

---

### 10. **JavaScript 支持**

**文件**: `js/`

**功能**:
- ✅ 支持 JavaScript/TypeScript 图定义
- ✅ 远程 UI 组件
- ✅ SSE（Server-Sent Events）
- ✅ 自定义 HTTP 代理

**示例**:
```json
{
  "graphs": {
    "agent": "./src/agent.ts:graph"
  }
}
```

---

## 🔧 **配置系统**

### `langgraph.json` 配置文件

```json
{
  "$schema": "https://langgra.ph/schema.json",
  
  // Python 版本
  "python_version": "3.13",
  
  // 依赖包
  "dependencies": [
    "langchain-openai",
    "langchain-anthropic"
  ],
  
  // 图定义
  "graphs": {
    "agent": "./graph.py:graph",
    "chatbot": "./chatbot.py:graph"
  },
  
  // 环境变量文件
  "env": ".env",
  
  // 长期记忆存储
  "store": {
    "index": {
      "dims": 1536,
      "embed": "openai:text-embedding-3-small"
    }
  },
  
  // HTTP 配置
  "http": {
    "app": "./custom_app.py:app"
  }
}
```

---

## 🌐 **环境变量**

### 核心配置

```bash
# API 端口
PORT=2024

# 数据库（生产环境）
POSTGRES_URI=postgresql://user:pass@localhost/db

# 认证
LANGSMITH_API_KEY=your_key

# CORS
CORS_ALLOW_ORIGINS=["http://localhost:3000"]

# 日志级别
LOG_LEVEL=INFO

# 私有网络
ALLOW_PRIVATE_NETWORK=true
```

---

## 📊 **持久化系统**

### 开发环境（内存）

```python
# 使用 InMemorySaver
# 数据存储在内存中，重启后丢失
```

### 生产环境（PostgreSQL）

```bash
# 设置数据库连接
export POSTGRES_URI=postgresql://user:pass@localhost/langgraph

# 自动创建表结构
# - checkpoints
# - checkpoint_writes
# - checkpoint_blobs
```

---

## 🎨 **Studio UI**

**访问地址**: https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024

**功能**:
- ✅ 可视化图结构
- ✅ 调试对话
- ✅ 查看状态
- ✅ 测试运行
- ✅ 查看日志

---

## 📖 **API 文档**

**访问地址**: http://127.0.0.1:2024/docs

**功能**:
- ✅ 自动生成 Swagger/OpenAPI 文档
- ✅ 交互式 API 测试
- ✅ 请求/响应示例
- ✅ 模型定义

---

## 🔍 **监控和日志**

### 结构化日志

```python
# 使用 structlog
import structlog
logger = structlog.stdlib.get_logger(__name__)

logger.info("处理请求", thread_id=thread_id, run_id=run_id)
```

### OpenTelemetry 支持

```python
# 自动集成 OpenTelemetry
# 支持分布式追踪
```

---

## 🚀 **高级功能**

### 1. **批量处理**

```bash
POST /runs/batch
{
  "runs": [
    {"thread_id": "...", "input": {...}},
    {"thread_id": "...", "input": {...}}
  ]
}
```

### 2. **中断和恢复**

```python
# 支持人工干预
# 可以暂停、修改状态、继续执行
```

### 3. **版本管理**

```bash
# 助手版本控制
GET /assistants/{id}/versions
```

### 4. **搜索和过滤**

```bash
POST /threads/search
{
  "filter": {"status": "active"},
  "limit": 10
}
```

---

## 📦 **部署选项**

### 1. **本地开发**

```bash
langgraph dev --port 2024
```

### 2. **Docker 部署**

```bash
langgraph dockerfile
docker build -t my-agent .
docker run -p 2024:8000 my-agent
```

### 3. **LangGraph Cloud**

```bash
langgraph deploy
```

---

## 🎯 **总结**

### 核心优势

| 功能 | 说明 |
|------|------|
| **标准化 API** | RESTful API，易于集成 |
| **自动持久化** | 无需手动管理状态 |
| **企业级功能** | 认证、监控、定时任务 |
| **开源可修改** | 完全控制代码 |
| **Studio UI** | 可视化调试工具 |
| **多语言支持** | Python + JavaScript/TypeScript |
| **云原生** | 支持 Docker、K8s |

### 适用场景

- ✅ **快速原型开发**
- ✅ **生产环境部署**
- ✅ **多 Agent 系统**
- ✅ **企业级应用**
- ✅ **学习和研究**

---

## 📚 **学习资源**

- **官方文档**: https://langchain-ai.github.io/langgraph/cloud/
- **API 参考**: http://127.0.0.1:2024/docs
- **源码位置**: `/Users/kay/anaconda3/envs/langgraph/lib/python3.13/site-packages/langgraph_api`
- **GitHub**: https://github.com/langchain-ai/langgraph

---

**LangGraph API 是一个功能完整、企业级的 AI 应用服务器！** 🎉

