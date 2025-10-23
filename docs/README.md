# 📚 项目文档目录

本目录包含项目的所有技术文档和指南。

---

## 🚀 快速开始

### 必读文档

1. **[环境配置指南](setup/ENVIRONMENT_SETUP.md)** - 配置 API Key 和环境变量
2. **[Git 工作流指南](git-workflow/README.md)** - 使用自动化脚本管理代码
3. **[LangGraph 持久化指南](setup/LANGGRAPH_PERSISTENCE_GUIDE.md)** - 配置对话持久化

---

## 📖 文档分类

### 🔧 开发指南

| 文档 | 说明 |
|------|------|
| [分支管理规范](git-workflow/BRANCH_MANAGEMENT.md) | Git 分支策略和管理规范 ⭐ |
| [发布流程](git-workflow/RELEASE_PROCESS.md) | 版本发布的完整流程 ⭐ |
| [Commit 规范](git-workflow/COMMIT_CONVENTION.md) | Commit 消息编写规范 ⭐ |
| [Code Review 指南](git-workflow/CODE_REVIEW_GUIDE.md) | 代码审查流程和最佳实践 ⭐ |
| [Git 工作流](git-workflow/) | Git 自动化脚本和使用指南 |
| [环境配置](setup/ENVIRONMENT_SETUP.md) | API Key 和环境变量配置 |
| [LangGraph 持久化](setup/LANGGRAPH_PERSISTENCE_GUIDE.md) | SQLite 持久化配置 |

### 📊 架构文档

| 文档 | 说明 |
|------|------|
| [系统架构](architecture/ARCHITECTURE.md) | 系统整体架构设计 |
| [前端适配](architecture/FRONTEND_ADAPTATION.md) | 前端架构和适配说明 |
| [后端重构](architecture/BACKEND_REFACTORING.md) | 后端模块化重构 |

### 🎯 功能文档

| 文档 | 说明 |
|------|------|
| [LangGraph API 功能](langgraph/LANGGRAPH_API_FEATURES.md) | LangGraph API 完整功能 |
| [LangGraph API 迁移](langgraph/LANGGRAPH_API_MIGRATION.md) | 迁移到官方 API 指南 |
| [LangGraph API 快速参考](langgraph/LANGGRAPH_API_QUICK_REFERENCE.md) | API 快速查询 |

### ⚡ 性能优化

| 文档 | 说明 |
|------|------|
| [前端性能优化](performance/FRONTEND_PERFORMANCE_OPTIMIZATION.md) | 前端性能优化记录 |
| [性能优化报告](performance/PERFORMANCE_OPTIMIZATION_REPORT.md) | 性能优化总结 |
| [代码块流式修复](performance/CODE_BLOCK_STREAMING_FIX.md) | 代码块显示优化 |
| [输出截断修复](performance/OUTPUT_TRUNCATION_FIX.md) | Token 限制调整 |

### 🔒 安全相关

| 文档 | 说明 |
|------|------|
| [API Key 清理](security/API_KEY_CLEANUP_SUMMARY.md) | 安全性改进总结 |

### 🧪 测试相关

| 文档 | 说明 |
|------|------|
| [自动化测试报告](testing/AUTOMATED_TEST_REPORT.md) | 自动化测试结果 |
| [测试总结](testing/TEST_SUMMARY.md) | 功能测试总结 |

### 🐛 问题修复

| 文档 | 说明 |
|------|------|
| [Bug 修复总结](fixes/BUG_FIX_SUMMARY.md) | 已修复的 Bug 列表 |

### 📝 总结报告

| 文档 | 说明 |
|------|------|
| [模块化总结](summaries/MODULARIZATION_SUMMARY.md) | 代码模块化重构总结 |
| [测试报告](summaries/TESTING_REPORT.md) | 功能测试报告 |

### 📖 学习资源

| 文档 | 说明 |
|------|------|
| [LangGraph & LangChain 1.0 完整指南](learning/LANGGRAPH_LANGCHAIN_1.0_GUIDE.md) | 基于源码的深度学习指南 ⭐⭐⭐ |
| [LangChain 与 LangGraph 协作指南](learning/LANGCHAIN_LANGGRAPH_COLLABORATION.md) | 智能体和工作流构建 ⭐⭐⭐ |
| [LangGraph 快速参考](learning/LANGGRAPH_QUICK_REFERENCE.md) | API 快速查询卡片 ⭐⭐ |
| [代码改进指南](learning/CODE_IMPROVEMENT_GUIDE.md) | 项目代码优化建议 ⭐⭐ |

---

## 🗂️ 目录结构

```text
docs/
├── README.md                    # 本文件
├── setup/                      # 环境配置
│   ├── ENVIRONMENT_SETUP.md
│   └── LANGGRAPH_PERSISTENCE_GUIDE.md
├── git-workflow/               # Git 工作流
│   ├── README.md
│   ├── BRANCH_MANAGEMENT.md        # 分支管理规范
│   ├── RELEASE_PROCESS.md          # 发布流程
│   ├── COMMIT_CONVENTION.md        # Commit 规范
│   ├── CODE_REVIEW_GUIDE.md        # Code Review 指南
│   ├── QUICK_REFERENCE.md
│   └── GUIDE.md
├── architecture/               # 架构文档
│   ├── ARCHITECTURE.md
│   ├── FRONTEND_ADAPTATION.md
│   ├── BACKEND_REFACTORING.md
│   └── REFACTORING.md
├── langgraph/                  # LangGraph 相关
│   ├── LANGGRAPH_API_FEATURES.md
│   ├── LANGGRAPH_API_MIGRATION.md
│   └── LANGGRAPH_API_QUICK_REFERENCE.md
├── performance/                # 性能优化
│   ├── FRONTEND_PERFORMANCE_OPTIMIZATION.md
│   ├── PERFORMANCE_OPTIMIZATION_REPORT.md
│   ├── CODE_BLOCK_STREAMING_FIX.md
│   └── OUTPUT_TRUNCATION_FIX.md
├── security/                   # 安全相关
│   └── API_KEY_CLEANUP_SUMMARY.md
├── testing/                    # 测试相关
│   ├── AUTOMATED_TEST_REPORT.md
│   └── TEST_SUMMARY.md
├── fixes/                      # 问题修复
│   └── BUG_FIX_SUMMARY.md
├── summaries/                  # 总结报告
│   ├── MODULARIZATION_SUMMARY.md
│   └── TESTING_REPORT.md
└── learning/                   # 学习资源
    ├── LANGGRAPH_LANGCHAIN_1.0_GUIDE.md
    ├── LANGCHAIN_LANGGRAPH_COLLABORATION.md
    ├── CODE_IMPROVEMENT_GUIDE.md
    └── LANGGRAPH_QUICK_REFERENCE.md
```

---

## 🔍 快速查找

### 我想

- **配置环境** → [环境配置指南](setup/ENVIRONMENT_SETUP.md)
- **使用 Git** → [Git 工作流](git-workflow/README.md)
- **了解架构** → [系统架构](architecture/ARCHITECTURE.md)
- **使用 LangGraph API** → [LangGraph API 功能](langgraph/LANGGRAPH_API_FEATURES.md)
- **优化性能** → [性能优化](performance/FRONTEND_PERFORMANCE_OPTIMIZATION.md)
- **查看测试** → [测试报告](testing/AUTOMATED_TEST_REPORT.md)
- **修复问题** → [Bug 修复总结](fixes/BUG_FIX_SUMMARY.md)
- **学习 LangGraph** → [LangGraph 完整指南](learning/LANGGRAPH_LANGCHAIN_1.0_GUIDE.md)
- **快速查询 API** → [LangGraph 快速参考](learning/LANGGRAPH_QUICK_REFERENCE.md)

---

## 📌 重要提示

### 环境配置（必须）

在运行项目前，必须配置 API Key：

```bash
# 在 ~/.bash_profile 或 ~/.zshrc 中添加
export DEEPSEEK_API_KEY=sk-your-api-key-here

# 使配置生效
source ~/.zshrc
```

详见：[环境配置指南](setup/ENVIRONMENT_SETUP.md)

### Git 工作流（推荐）

使用自动化脚本简化 Git 操作：

```bash
# 创建新功能分支
./git-workflow.sh new feature-name

# 快速提交并推送
./git-workflow.sh quick "feat: 提交信息"

# 合并到 main
./git-workflow.sh merge
```

详见：[Git 工作流指南](git-workflow/README.md)

---

## 🔗 外部资源

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [Next.js 文档](https://nextjs.org/docs)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

---

**最后更新**: 2025-01-16
