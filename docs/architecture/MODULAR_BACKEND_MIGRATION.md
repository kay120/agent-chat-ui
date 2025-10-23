# 模块化后端迁移文档

## 概述

本文档记录了从单文件后端 (`langgraph_server.py`) 迁移到模块化后端 (`backend/`) 的过程。

## 迁移日期

2025-01-04

## 架构对比

### 旧架构（单文件）

```
agent-chat-ui/
├── langgraph_server.py  # 所有代码在一个文件中
├── .env
└── start.sh
```

**缺点**：
- 代码全部在一个文件中，难以维护
- 没有清晰的模块划分
- 难以测试和扩展

### 新架构（模块化）

```
agent-chat-ui/
├── backend/
│   ├── __init__.py
│   ├── main.py                    # 应用入口
│   ├── config.py                  # 配置管理
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py              # 路由定义
│   │   └── handlers.py            # 请求处理器
│   ├── models/
│   │   ├── __init__.py
│   │   ├── schemas.py             # Pydantic 模型
│   │   └── state.py               # LangGraph 状态
│   └── services/
│       ├── __init__.py
│       ├── database_service.py    # SQLite 数据库服务
│       ├── thread_service.py      # 线程管理服务
│       ├── graph_service.py       # LangGraph 服务
│       └── llm_service.py         # LLM 服务
├── .env
└── start.sh
```

**优点**：
- ✅ 清晰的模块划分
- ✅ 易于测试和维护
- ✅ 支持 SQLite 持久化
- ✅ 代码复用性高
- ✅ 易于扩展新功能

## 核心模块说明

### 1. `backend/main.py`

应用入口，负责：
- 创建 FastAPI 应用
- 配置 CORS 中间件
- 注册路由
- 启动/关闭事件处理

### 2. `backend/config.py`

配置管理，使用 Pydantic Settings：
- DeepSeek API 配置
- LLM 参数配置
- CORS 配置
- 数据库配置

### 3. `backend/services/database_service.py`

SQLite 数据库服务：
- 线程表管理
- 消息表管理
- CRUD 操作
- 事务管理

**数据库表结构**：

```sql
-- 线程表
CREATE TABLE threads (
    thread_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 消息表
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
);
```

### 4. `backend/services/thread_service.py`

线程管理服务：
- 创建线程
- 保存消息
- 获取线程
- 删除线程
- 内存缓存 + 数据库持久化

### 5. `backend/services/graph_service.py`

LangGraph 服务：
- 流式处理
- 消息转换
- 上下文管理
- SSE 事件生成

### 6. `backend/api/routes.py`

API 路由定义：
- `POST /threads/search` - 搜索线程
- `POST /threads` - 创建线程
- `GET /threads/{thread_id}/state` - 获取线程状态
- `POST /threads/{thread_id}/runs/stream` - 流式运行
- `DELETE /threads/{thread_id}` - 删除线程
- `GET /info` - 获取服务信息

### 7. `backend/api/handlers.py`

请求处理器：
- 处理业务逻辑
- 调用服务层
- 返回响应

## 关键特性

### 1. SQLite 持久化

所有对话历史保存到 SQLite 数据库：
- 数据库文件：`checkpoints.sqlite`
- 重启服务器后数据不丢失
- 支持完整的 CRUD 操作

### 2. 内存缓存

使用内存缓存提高性能：
- 首次访问从数据库加载
- 后续访问从缓存读取
- 写入时同时更新缓存和数据库

### 3. 流式处理

支持 SSE (Server-Sent Events) 流式输出：
- `event: metadata` - 元数据
- `event: messages/partial` - 流式消息
- `event: values` - 最终值
- `event: end` - 结束事件

### 4. 上下文记忆

完整的对话历史管理：
- 加载线程历史
- 添加新消息
- 保存到数据库
- 支持多轮对话

## 启动方式

### 旧方式

```bash
python langgraph_server.py
```

### 新方式

```bash
python -m backend.main
```

或使用启动脚本：

```bash
./start.sh
```

## 环境变量

`.env` 文件配置：

```bash
# DeepSeek API
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MAX_TOKENS=8000
DEEPSEEK_TEMPERATURE=0.7

# 数据库
SQLITE_DB_PATH=checkpoints.sqlite
```

## 迁移步骤

1. ✅ 创建模块化目录结构
2. ✅ 实现数据库服务
3. ✅ 更新线程服务使用数据库
4. ✅ 更新 Graph 服务支持流式处理
5. ✅ 添加所有必要的 API 端点
6. ✅ 更新配置管理
7. ✅ 更新启动脚本
8. ✅ 测试所有功能

## 测试清单

- [x] 创建新线程
- [x] 发送消息
- [x] 流式输出
- [x] 上下文记忆
- [x] 历史记录列表
- [x] 切换线程
- [x] 重启服务器后数据保留
- [x] 删除线程

## 性能优化

1. **内存缓存**：减少数据库查询
2. **索引优化**：在 `thread_id` 和 `created_at` 上创建索引
3. **连接池**：使用上下文管理器管理数据库连接
4. **异步处理**：使用 `async/await` 提高并发性能

## 未来改进

1. **Redis 缓存**：替换内存缓存，支持分布式部署
2. **PostgreSQL**：替换 SQLite，支持更大规模数据
3. **消息队列**：使用 Celery 处理长时间运行的任务
4. **API 版本控制**：支持多个 API 版本
5. **单元测试**：添加完整的测试覆盖
6. **日志系统**：使用结构化日志
7. **监控告警**：集成 Prometheus + Grafana

## 常见问题

### Q: 如何切换回旧版本？

A: 修改 `start.sh`：

```bash
# 使用旧版本
python langgraph_server.py &

# 使用新版本
python -m backend.main &
```

### Q: 数据库文件在哪里？

A: 默认在 `agent-chat-ui/checkpoints.sqlite`

### Q: 如何清空数据库？

A: 删除数据库文件：

```bash
rm checkpoints.sqlite
```

### Q: 如何查看数据库内容？

A: 使用 SQLite 命令行工具：

```bash
sqlite3 checkpoints.sqlite
.tables
SELECT * FROM threads;
SELECT * FROM messages;
```

## 总结

模块化后端迁移成功完成！新架构提供了：

- ✅ 更好的代码组织
- ✅ SQLite 持久化存储
- ✅ 完整的上下文记忆
- ✅ 流式输出支持
- ✅ 易于维护和扩展

所有功能都已测试通过，可以正常使用。

