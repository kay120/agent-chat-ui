# 🏗️ Agent Chat UI 架构文档

## 📋 项目概述

Agent Chat UI 是一个基于 LangGraph 和 Next.js 的智能聊天应用，支持实时流式输出、历史记录管理和后台运行等高级功能。

## 🎯 核心功能

1. ✅ **实时流式输出**: AI 回复逐字逐句显示
2. ✅ **历史记录管理**: 保存和加载对话历史
3. ✅ **后台运行**: 切换对话时，AI 继续在后台回答
4. ✅ **取消功能**: 随时中止 AI 回答
5. ✅ **中文界面**: 完全中文本地化

## 🏛️ 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                             │
│                  (localhost:3000)                        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/SSE
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  前端 (Next.js)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  src/providers/                                  │   │
│  │  ├── Stream.tsx (主 Provider)                   │   │
│  │  └── stream/                                     │   │
│  │      ├── useStreamState.ts (状态管理)           │   │
│  │      ├── useBackgroundThreads.ts (后台线程)     │   │
│  │      ├── useThreadLoader.ts (线程加载)          │   │
│  │      └── streamService.ts (流式处理)            │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  src/components/thread/                          │   │
│  │  ├── index.tsx (主界面)                         │   │
│  │  ├── messages/ (消息组件)                       │   │
│  │  └── history/ (历史记录)                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/SSE
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  后端 (FastAPI)                          │
│                  (localhost:2024)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  backend/api/                                    │   │
│  │  ├── routes.py (路由定义)                       │   │
│  │  └── handlers.py (请求处理)                     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  backend/services/                               │   │
│  │  ├── llm_service.py (LLM 服务)                  │   │
│  │  ├── thread_service.py (线程管理)               │   │
│  │  └── graph_service.py (LangGraph 服务)          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  backend/models/                                 │   │
│  │  ├── state.py (状态定义)                        │   │
│  │  └── schemas.py (数据模型)                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              DeepSeek API                                │
│         (api.deepseek.com)                              │
└─────────────────────────────────────────────────────────┘
```

## 📦 前端架构

### 目录结构
```
src/
├── providers/
│   ├── Stream.tsx                    # 主 Provider（300 行）
│   ├── Thread.tsx                    # 线程 Provider
│   └── stream/                       # 流式处理模块
│       ├── types.ts                  # 类型定义
│       ├── useStreamState.ts         # 状态管理
│       ├── useBackgroundThreads.ts   # 后台线程管理
│       ├── useThreadLoader.ts        # 线程加载逻辑
│       └── streamService.ts          # 流式处理服务
├── components/
│   └── thread/
│       ├── index.tsx                 # 主界面组件
│       ├── messages/                 # 消息组件
│       └── history/                  # 历史记录组件
└── app/
    ├── page.tsx                      # 主页面
    └── layout.tsx                    # 布局
```

### 数据流

```
用户输入
    │
    ▼
StreamProvider (submit)
    │
    ▼
StreamService.execute()
    │
    ├─→ 发送 HTTP 请求到后端
    │
    ├─→ 接收 SSE 流式数据
    │
    ├─→ 更新前台/后台消息
    │       │
    │       ├─→ 当前线程: 更新界面
    │       └─→ 后台线程: 只更新数据
    │
    └─→ 刷新历史记录
```

## 📦 后端架构

### 目录结构
```
backend/
├── main.py                    # FastAPI 应用入口
├── config.py                  # 配置管理
├── models/
│   ├── state.py              # LangGraph 状态
│   └── schemas.py            # Pydantic 模型
├── services/
│   ├── llm_service.py        # LLM 服务
│   ├── thread_service.py     # 线程管理
│   └── graph_service.py      # LangGraph 服务
└── api/
    ├── routes.py             # 路由定义
    └── handlers.py           # 请求处理器
```

### 数据流

```
HTTP 请求
    │
    ▼
FastAPI Router
    │
    ▼
Request Handler
    │
    ▼
Service Layer
    │
    ├─→ LLMService: 调用 DeepSeek API
    │
    ├─→ GraphService: LangGraph 流式处理
    │
    └─→ ThreadService: 保存/加载线程
    │
    ▼
SSE 响应流
```

## 🔄 核心流程

### 1. 发送消息流程

```
1. 用户输入消息
2. 前端调用 submit()
3. StreamService 发送 POST /runs/stream
4. 后端 GraphService 开始流式处理
5. 后端通过 SSE 发送数据块
6. 前端接收并更新界面
7. 完成后刷新历史记录
```

### 2. 切换历史对话流程

```
1. 用户点击历史记录
2. ThreadLoader 检查后台线程
3. 如果有后台数据，直接恢复
4. 否则从后端加载线程消息
5. 更新界面显示
```

### 3. 后台运行流程

```
1. 用户发送消息，AI 开始回答
2. 用户切换到其他对话
3. ThreadLoader 保存当前消息到后台
4. StreamService 继续接收数据
5. 数据更新到后台线程（不更新界面）
6. 用户切换回来时，显示最新数据
```

## 🛠️ 技术栈

### 前端
- **Next.js 15.3.2**: React 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式
- **shadcn/ui**: UI 组件库
- **nuqs**: URL 状态管理
- **Framer Motion**: 动画

### 后端
- **FastAPI**: Web 框架
- **LangChain**: LLM 框架
- **LangGraph**: 工作流编排
- **Pydantic**: 数据验证
- **Uvicorn**: ASGI 服务器

### AI
- **DeepSeek**: LLM 提供商
- **deepseek-chat**: 模型

## 📊 性能优化

### 前端
1. **React.memo**: 避免不必要的重渲染
2. **flushSync**: 确保流式更新立即生效
3. **后台线程**: 使用 Map 高效管理
4. **useRef**: 避免 useEffect 依赖问题

### 后端
1. **异步处理**: 使用 async/await
2. **流式输出**: SSE 实时传输
3. **内存存储**: 快速读写（可升级为数据库）

## 🔒 安全性

1. **CORS**: 配置允许的源
2. **API Key**: DeepSeek API 密钥管理
3. **输入验证**: Pydantic 自动验证
4. **错误处理**: 统一错误响应

## 📈 可扩展性

### 前端
- ✅ 模块化设计，易于添加新功能
- ✅ Hooks 可复用
- ✅ 服务类可扩展

### 后端
- ✅ 服务层独立，易于替换
- ✅ 支持添加新端点
- ✅ 可集成数据库、缓存等

## 🧪 测试策略

### 前端
- 单元测试: Jest + React Testing Library
- 集成测试: Playwright
- E2E 测试: Cypress

### 后端
- 单元测试: pytest
- 集成测试: pytest + httpx
- API 测试: Postman/Insomnia

## 📝 开发指南

### 启动开发环境

```bash
# 1. 启动后端
cd agent-chat-ui
python run_server.py

# 2. 启动前端
cd agent-chat-ui
pnpm dev
```

### 添加新功能

#### 前端
1. 在 `src/providers/stream/` 添加新 Hook
2. 在 `StreamService` 添加新方法
3. 在组件中使用

#### 后端
1. 在 `backend/services/` 添加新服务
2. 在 `backend/api/handlers.py` 添加处理器
3. 在 `backend/api/routes.py` 添加路由

## 📚 相关文档

- [前端重构文档](./REFACTORING.md)
- [后端重构文档](./BACKEND_REFACTORING.md)
- [API 文档](./API.md) (待创建)
- [部署文档](./DEPLOYMENT.md) (待创建)

## 🎯 未来规划

### 短期 (1-2 周)
- [ ] 添加单元测试
- [ ] 完善错误处理
- [ ] 添加日志系统

### 中期 (1-2 月)
- [ ] 集成数据库 (PostgreSQL)
- [ ] 添加用户认证
- [ ] 支持多模型切换

### 长期 (3-6 月)
- [ ] 添加语音输入/输出
- [ ] 支持文件上传
- [ ] 多语言支持
- [ ] 移动端适配

## 👥 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 📄 许可证

MIT License

