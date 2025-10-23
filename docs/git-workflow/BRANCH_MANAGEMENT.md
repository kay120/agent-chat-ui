# Git 分支管理规范

## 📋 目录

- [分支策略](#分支策略)
- [分支命名规范](#分支命名规范)
- [工作流程](#工作流程)
- [Pull Request 规范](#pull-request-规范)
- [Code Review 规范](#code-review-规范)
- [版本管理](#版本管理)
- [最佳实践](#最佳实践)

## 分支策略

### 分支类型

```
master (生产环境)
  ↑
  └── release-YYYY-MM-DD (发布分支)
        ↑
        ├── dev (开发环境)
        │     ↑
        │     ├── feature/* (功能分支)
        │     ├── bugfix/* (修复分支)
        │     └── refactor/* (重构分支)
        │
        └── hotfix/* (紧急修复)
```

### 分支说明

| 分支 | 命名规则 | 生命周期 | 保护级别 | 说明 |
|------|---------|---------|---------|------|
| `master` | `master` | 永久 | 🔒 最高 | 生产环境代码，只接受 release 分支合并 |
| `dev` | `dev` | 永久 | 🔒 高 | 开发环境代码，日常开发基础分支 |
| `release-*` | `release-YYYY-MM-DD` | 临时 | 🔒 高 | 发布准备分支，用于测试和修复 |
| `feature/*` | `feature/功能名` | 临时 | - | 新功能开发分支 |
| `bugfix/*` | `bugfix/问题描述` | 临时 | - | Bug 修复分支 |
| `refactor/*` | `refactor/模块名` | 临时 | - | 代码重构分支 |
| `hotfix/*` | `hotfix/紧急问题` | 临时 | 🔒 中 | 生产环境紧急修复分支 |

## 分支命名规范

### 功能分支 (feature/*)

```bash
# 格式
feature/<功能描述>

# 示例
feature/user-authentication
feature/chat-streaming
feature/sqlite-persistence
feature/admin-dashboard
```

### Bug 修复分支 (bugfix/*)

```bash
# 格式
bugfix/<问题描述>

# 示例
bugfix/fix-streaming-block
bugfix/fix-history-not-update
bugfix/fix-memory-leak
```

### 重构分支 (refactor/*)

```bash
# 格式
refactor/<模块名>

# 示例
refactor/backend-architecture
refactor/database-layer
refactor/api-handlers
```

### 紧急修复分支 (hotfix/*)

```bash
# 格式
hotfix/<紧急问题>

# 示例
hotfix/security-vulnerability
hotfix/critical-crash
hotfix/data-loss-issue
```

### 发布分支 (release-*)

```bash
# 格式
release-YYYY-MM-DD

# 示例
release-2025-01-16
release-2025-02-01
release-2025-03-15
```

## 工作流程

### 1. 日常开发流程

#### 步骤 1: 创建功能分支

```bash
# 1. 切换到 dev 分支并更新
git checkout dev
git pull origin dev

# 2. 创建功能分支
git checkout -b feature/new-chat-feature

# 3. 开发并提交
git add .
git commit -m "feat: 添加新的聊天功能"

# 4. 推送到远程
git push origin feature/new-chat-feature
```

#### 步骤 2: 创建 Pull Request

1. 在 GitHub/GitLab 上创建 PR
2. 标题格式：`feat: 添加新的聊天功能`
3. 选择：`feature/new-chat-feature` → `dev`
4. 填写 PR 描述（使用模板）
5. 指定 Reviewers

#### 步骤 3: Code Review

1. 至少 1 名开发人员 Review
2. 解决所有 Review 意见
3. 确保 CI 测试通过
4. 获得 Approve

#### 步骤 4: 合并到 dev

1. 使用 **Squash and Merge** 或 **Merge Commit**
2. 删除功能分支（可选）

```bash
# 本地删除分支
git branch -d feature/new-chat-feature

# 删除远程分支
git push origin --delete feature/new-chat-feature
```

### 2. 发布流程

#### 步骤 1: 创建 Release 分支

```bash
# 1. 从 master 创建 release 分支
git checkout master
git pull origin master
git checkout -b release-2025-01-16

# 2. 推送到远程
git push origin release-2025-01-16
```

#### 步骤 2: 合并 dev 到 release

```bash
# 创建 PR: dev → release-2025-01-16
# 标题: "Release 2025-01-16 - 版本 v1.2.0"
# 描述: 使用 Release PR 模板
```

**PR 要求**：
- 所有相关开发人员必须 Review
- 至少 2 人 Approve
- 所有 CI 测试通过
- 完成功能测试

#### 步骤 3: Release 分支测试和修复

```bash
# 在 release 分支上进行测试
git checkout release-2025-01-16

# 如果发现问题，直接在 release 分支修复
git add .
git commit -m "fix: 修复发布前发现的登录问题"
git push origin release-2025-01-16

# 测试通过后继续下一步
```

#### 步骤 4: 合并到 master

```bash
# 创建 PR: release-2025-01-16 → master
# 标题: "🚀 Release v1.2.0 - 2025-01-16"
# 描述: 使用 Release to Master PR 模板
```

**PR 要求**：
- 至少 2 名 Maintainer Approve
- 所有测试通过
- 部署检查清单完成

#### 步骤 5: 打标签

```bash
# 1. 合并后切换到 master
git checkout master
git pull origin master

# 2. 创建标签
git tag -a v1.2.0 -m "Release v1.2.0 - 2025-01-16

新功能:
- 流式聊天功能
- SQLite 持久化
- 模块化后端架构

Bug 修复:
- 修复前端卡顿问题
- 修复历史记录不更新
"

# 3. 推送标签
git push origin v1.2.0
```

#### 步骤 6: 同步到 dev

```bash
# 1. 将 release 分支的修复同步回 dev
git checkout dev
git merge release-2025-01-16
git push origin dev

# 2. 删除 release 分支（可选）
git branch -d release-2025-01-16
git push origin --delete release-2025-01-16
```

#### 步骤 7: 发布 Release Notes

在 GitHub/GitLab 上创建 Release：
- 标题：`v1.2.0 - 2025-01-16`
- 标签：`v1.2.0`
- 描述：从 CHANGELOG.md 复制

### 3. 紧急修复流程 (Hotfix)

#### 步骤 1: 创建 Hotfix 分支

```bash
# 从 master 创建 hotfix 分支
git checkout master
git pull origin master
git checkout -b hotfix/critical-security-issue
```

#### 步骤 2: 修复并测试

```bash
# 修复问题
git add .
git commit -m "hotfix: 修复严重安全漏洞 CVE-2025-1234"
git push origin hotfix/critical-security-issue
```

#### 步骤 3: 合并到 master

```bash
# 创建 PR: hotfix/critical-security-issue → master
# 标题: "🚨 Hotfix v1.2.1 - 紧急安全修复"
```

**PR 要求**：
- 至少 1 名 Maintainer 紧急 Review
- 快速测试验证
- 立即部署

#### 步骤 4: 打补丁标签

```bash
git checkout master
git pull origin master
git tag -a v1.2.1 -m "Hotfix v1.2.1 - 紧急安全修复"
git push origin v1.2.1
```

#### 步骤 5: 同步到 dev

```bash
git checkout dev
git merge hotfix/critical-security-issue
git push origin dev
```

## Pull Request 规范

### PR 标题格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>: <description>

类型 (type):
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式（不影响功能）
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建/工具/依赖

示例:
feat: 添加流式聊天功能
fix: 修复前端卡顿问题
docs: 更新 API 文档
refactor: 重构后端架构为模块化
```

### PR 描述模板

详见 `.github/pull_request_template.md`

### PR 合并策略

| 场景 | 合并方式 | 说明 |
|------|---------|------|
| feature → dev | Squash and Merge | 保持 dev 历史简洁 |
| bugfix → dev | Squash and Merge | 保持 dev 历史简洁 |
| dev → release | Merge Commit | 保留完整历史 |
| release → master | Merge Commit | 保留完整历史 |
| hotfix → master | Merge Commit | 保留完整历史 |

## Code Review 规范

### Review 检查清单

#### 功能性
- [ ] 代码实现符合需求
- [ ] 边界条件处理正确
- [ ] 错误处理完善
- [ ] 无明显 Bug

#### 代码质量
- [ ] 代码可读性好
- [ ] 命名规范清晰
- [ ] 注释充分合理
- [ ] 无重复代码

#### 性能
- [ ] 无明显性能问题
- [ ] 数据库查询优化
- [ ] 无内存泄漏

#### 安全
- [ ] 无安全漏洞
- [ ] 输入验证完善
- [ ] 敏感信息保护

#### 测试
- [ ] 有相应测试用例
- [ ] 测试覆盖率足够
- [ ] 所有测试通过

### Review 意见分类

| 标签 | 说明 | 是否阻塞合并 |
|------|------|------------|
| 🔴 必须修改 | 严重问题，必须修复 | ✅ 是 |
| 🟡 建议修改 | 可以改进，但不强制 | ❌ 否 |
| 🟢 可选优化 | 锦上添花的优化 | ❌ 否 |
| 💡 讨论 | 需要讨论的设计问题 | 视情况 |
| ✅ 已确认 | 确认无问题 | ❌ 否 |

### Review 响应时间

| PR 类型 | 响应时间 | Approve 要求 |
|---------|---------|-------------|
| feature → dev | 1 工作日 | 至少 1 人 |
| bugfix → dev | 4 小时 | 至少 1 人 |
| dev → release | 1 工作日 | 至少 2 人 |
| release → master | 4 小时 | 至少 2 名 Maintainer |
| hotfix → master | 立即 | 至少 1 名 Maintainer |

## 版本管理

### 语义化版本

使用 [Semantic Versioning](https://semver.org/)：

```
v主版本.次版本.补丁版本

示例: v1.2.3
- 主版本 (1): 破坏性变更
- 次版本 (2): 新功能（向后兼容）
- 补丁版本 (3): Bug 修复（向后兼容）
```

### 版本号规则

| 变更类型 | 版本号变化 | 示例 |
|---------|-----------|------|
| 破坏性变更 | 主版本 +1 | v1.2.3 → v2.0.0 |
| 新功能 | 次版本 +1 | v1.2.3 → v1.3.0 |
| Bug 修复 | 补丁版本 +1 | v1.2.3 → v1.2.4 |
| Hotfix | 补丁版本 +1 | v1.2.3 → v1.2.4 |

### 标签命名

```bash
# 正式版本
v1.2.0
v1.2.1
v2.0.0

# 预发布版本（可选）
v1.3.0-rc.1    # Release Candidate
v1.3.0-beta.1  # Beta 版本
v1.3.0-alpha.1 # Alpha 版本
```

## 最佳实践

### Commit 规范

```bash
# 格式
<type>(<scope>): <subject>

<body>

<footer>

# 示例
feat(backend): 添加 SQLite 持久化存储

- 创建 database_service.py
- 实现线程和消息表
- 添加 CRUD 操作

Closes #123
```

### Commit 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | `feat: 添加用户认证` |
| fix | Bug 修复 | `fix: 修复登录失败问题` |
| docs | 文档 | `docs: 更新 README` |
| style | 格式 | `style: 格式化代码` |
| refactor | 重构 | `refactor: 重构数据库层` |
| perf | 性能 | `perf: 优化查询性能` |
| test | 测试 | `test: 添加单元测试` |
| chore | 构建/工具 | `chore: 更新依赖` |

### 分支保护规则

#### master 分支
- ✅ 禁止直接推送
- ✅ 要求 PR
- ✅ 要求至少 2 个 Approve
- ✅ 要求 CI 通过
- ✅ 要求分支最新

#### dev 分支
- ✅ 禁止直接推送
- ✅ 要求 PR
- ✅ 要求至少 1 个 Approve
- ✅ 要求 CI 通过

#### release-* 分支
- ✅ 禁止直接推送（除紧急修复）
- ✅ 要求 PR
- ✅ 要求至少 2 个 Approve
- ✅ 要求 CI 通过

### 自动化建议

1. **CI/CD 流程**
   - 自动运行测试
   - 自动代码检查（lint）
   - 自动构建
   - 自动部署（master 分支）

2. **自动化工具**
   - GitHub Actions / GitLab CI
   - Husky (Git Hooks)
   - Commitlint (Commit 规范检查)
   - Semantic Release (自动版本管理)

3. **通知机制**
   - PR 创建通知
   - Review 请求通知
   - 合并通知
   - 部署通知

## 常见问题

### Q: 如何处理冲突？

```bash
# 1. 更新目标分支
git checkout dev
git pull origin dev

# 2. 切换回功能分支
git checkout feature/my-feature

# 3. 合并或变基
git merge dev
# 或
git rebase dev

# 4. 解决冲突后推送
git push origin feature/my-feature --force-with-lease
```

### Q: 如何撤销错误的合并？

```bash
# 如果还没推送
git reset --hard HEAD~1

# 如果已经推送
git revert -m 1 <merge-commit-hash>
```

### Q: Release 分支可以删除吗？

可以。合并到 master 并同步到 dev 后，release 分支可以删除。但建议保留一段时间以便回溯。

### Q: 多个功能同时开发怎么办？

每个功能独立创建分支，互不影响。都从 dev 分支创建，完成后分别合并回 dev。

## 相关文档

- [Pull Request 模板](./PULL_REQUEST_TEMPLATE.md)
- [发布流程](./RELEASE_PROCESS.md)
- [Commit 规范](./COMMIT_CONVENTION.md)
- [Code Review 指南](./CODE_REVIEW_GUIDE.md)

---

**文档版本**: v1.0.0  
**最后更新**: 2025-01-16  
**维护者**: 开发团队

