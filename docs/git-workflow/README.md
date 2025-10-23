# Git 工作流文档

## 📚 文档概览

本目录包含完整的 Git 工作流规范和指南，帮助团队高效协作和管理代码。

## 📖 核心文档

### 1. [分支管理规范](./BRANCH_MANAGEMENT.md) ⭐⭐⭐

**必读文档**，定义了项目的分支策略和管理规范。

**适用场景**：创建分支、提交 PR、Code Review、发布版本

### 2. [发布流程](./RELEASE_PROCESS.md) ⭐⭐⭐

**发布必读**，详细说明版本发布的完整流程。

**适用场景**：准备发布、执行发布、紧急修复、回滚版本

### 3. [Commit 规范](./COMMIT_CONVENTION.md) ⭐⭐

**提交必读**，规范 Commit 消息的编写格式。

**适用场景**：每次提交代码、编写 Commit 消息

### 4. [Code Review 指南](./CODE_REVIEW_GUIDE.md) ⭐⭐

**Review 必读**，指导如何进行高质量的代码审查。

**适用场景**：进行 Code Review、响应 Review 意见

---

## 🚀 快速开始

### 日常开发流程

```bash
# 1. 从 dev 创建功能分支
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# 2. 开发并提交（遵循 Commit 规范）
git add .
git commit -m "feat: 添加新功能"

# 3. 推送并创建 PR
git push origin feature/new-feature
# 在 GitHub/GitLab 上创建 Pull Request

# 4. Code Review 并合并到 dev
```

### 发布流程

```bash
# 1. 从 master 创建 release 分支
git checkout master
git pull origin master
git checkout -b release-2025-01-16

# 2. 合并 dev 到 release（通过 PR）
# 3. 测试和修复
# 4. 合并到 master（通过 PR）

# 5. 打标签
git checkout master
git pull origin master
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# 6. 同步到 dev
git checkout dev
git merge release-2025-01-16
git push origin dev
```

---

## 📋 分支策略

```
master (生产环境)
  ↑
  └── release-2025-01-16 (发布分支)
        ↑
        ├── dev (开发环境)
        │     ↑
        │     ├── feature/user-auth
        │     ├── feature/chat-ui
        │     ├── bugfix/fix-streaming
        │     └── refactor/backend
        │
        └── hotfix/critical-bug
```

### 分支类型

| 分支 | 命名规则 | 说明 |
|------|---------|------|
| `master` | `master` | 生产环境代码 |
| `dev` | `dev` | 开发环境代码 |
| `release-*` | `release-YYYY-MM-DD` | 发布准备分支 |
| `feature/*` | `feature/功能名` | 新功能开发 |
| `bugfix/*` | `bugfix/问题描述` | Bug 修复 |
| `hotfix/*` | `hotfix/紧急问题` | 紧急修复 |

---

## 🎯 Commit 规范

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录` |
| `fix` | Bug 修复 | `fix: 修复登录失败` |
| `docs` | 文档 | `docs: 更新 README` |
| `refactor` | 重构 | `refactor: 重构用户服务` |
| `perf` | 性能优化 | `perf: 优化查询性能` |
| `test` | 测试 | `test: 添加登录测试` |
| `chore` | 其他 | `chore: 更新依赖` |

### 示例

```bash
# 简单提交
git commit -m "feat: 添加用户注册功能"

# 完整提交
git commit -m "feat(backend): 添加 SQLite 持久化

- 创建 database_service.py
- 实现 CRUD 操作
- 集成到现有服务

Closes #124"
```

---

## 📝 Pull Request 规范

### PR 标题

```
<type>: <description>

示例:
feat: 添加流式聊天功能
fix: 修复前端卡顿问题
docs: 更新 API 文档
```

### PR 描述

使用 [PR 模板](../../.github/pull_request_template.md)，包含：

- 变更类型
- 变更描述
- 相关 Issue
- 测试情况
- Checklist

### PR 合并要求

| 场景 | Approve 要求 | CI 要求 |
|------|-------------|---------|
| feature → dev | 至少 1 人 | 必须通过 |
| dev → release | 至少 2 人 | 必须通过 |
| release → master | 至少 2 名 Maintainer | 必须通过 |

---

## 🔍 Code Review 检查清单

### 功能性
- [ ] 功能符合需求
- [ ] 边界条件处理正确
- [ ] 错误处理完善

### 代码质量
- [ ] 代码可读性好
- [ ] 命名规范清晰
- [ ] 注释充分合理

### 性能
- [ ] 无明显性能问题
- [ ] 数据库查询优化

### 安全
- [ ] 无安全漏洞
- [ ] 输入验证完善

### 测试
- [ ] 有相应测试用例
- [ ] 所有测试通过

---

## 🔧 常用命令

### 分支操作

```bash
# 创建并切换分支
git checkout -b feature/new-feature

# 查看所有分支
git branch -a

# 删除本地分支
git branch -d feature/old-feature

# 删除远程分支
git push origin --delete feature/old-feature
```

### 提交操作

```bash
# 查看状态
git status

# 暂存变更
git add .

# 提交
git commit -m "feat: 提交消息"

# 修改最后一次提交
git commit --amend
```

### 同步操作

```bash
# 拉取最新代码
git pull origin dev

# 推送到远程
git push origin feature/my-feature

# 强制推送（谨慎使用）
git push --force-with-lease origin feature/my-feature
```

---

## ❓ 常见问题

### Q: 我应该从哪个分支创建功能分支？

A: 从 `dev` 分支创建。

### Q: 如何处理冲突？

A: 
```bash
# 更新目标分支
git checkout dev
git pull origin dev

# 切换回功能分支并合并
git checkout feature/my-feature
git merge dev

# 解决冲突后提交
git add .
git commit -m "merge: 解决冲突"
git push origin feature/my-feature
```

### Q: PR 太大怎么办？

A: 拆分成多个小 PR，每个 PR 建议 < 400 行。

### Q: 如何回滚错误的合并？

A:
```bash
# 如果还没推送
git reset --hard HEAD~1

# 如果已经推送
git revert -m 1 <merge-commit-hash>
```

---

## 🔗 相关资源

### 内部文档

- [分支管理规范](./BRANCH_MANAGEMENT.md)
- [发布流程](./RELEASE_PROCESS.md)
- [Commit 规范](./COMMIT_CONVENTION.md)
- [Code Review 指南](./CODE_REVIEW_GUIDE.md)
- [PR 模板](../../.github/pull_request_template.md)

### 外部资源

- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**文档版本**: v1.0.0  
**最后更新**: 2025-01-16  
**维护者**: 开发团队

