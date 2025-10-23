# Commit 规范

## 📋 目录

- [Commit 消息格式](#commit-消息格式)
- [类型说明](#类型说明)
- [示例](#示例)
- [最佳实践](#最佳实践)
- [工具配置](#工具配置)

## Commit 消息格式

本项目采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 基本格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 格式说明

| 部分 | 必填 | 说明 |
|------|------|------|
| `type` | ✅ 是 | 提交类型 |
| `scope` | ❌ 否 | 影响范围 |
| `subject` | ✅ 是 | 简短描述 |
| `body` | ❌ 否 | 详细描述 |
| `footer` | ❌ 否 | 关联 Issue、破坏性变更 |

### 详细说明

#### Type (类型)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户登录功能` |
| `fix` | Bug 修复 | `fix: 修复登录失败问题` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `style` | 代码格式（不影响功能） | `style: 格式化代码` |
| `refactor` | 重构（不是新功能也不是修复） | `refactor: 重构用户服务` |
| `perf` | 性能优化 | `perf: 优化数据库查询` |
| `test` | 测试相关 | `test: 添加用户登录测试` |
| `build` | 构建系统或外部依赖 | `build: 升级 webpack 到 5.0` |
| `ci` | CI 配置文件和脚本 | `ci: 添加 GitHub Actions` |
| `chore` | 其他不修改源码的变更 | `chore: 更新 .gitignore` |
| `revert` | 回退之前的提交 | `revert: 回退 feat: 添加登录` |

#### Scope (范围)

可选，表示影响的模块或组件：

```
feat(backend): 添加用户认证
fix(frontend): 修复按钮样式
docs(api): 更新接口文档
```

常用 scope：
- `backend` - 后端
- `frontend` - 前端
- `api` - API 接口
- `database` - 数据库
- `ui` - 用户界面
- `auth` - 认证
- `config` - 配置
- `deps` - 依赖

#### Subject (主题)

简短描述，不超过 50 个字符：

✅ **好的示例**：
```
feat: 添加用户登录功能
fix: 修复内存泄漏问题
docs: 更新安装指南
```

❌ **不好的示例**：
```
feat: 添加了一个非常复杂的用户登录功能，包括邮箱验证、手机验证等
fix: 修复了一些问题
docs: 更新
```

**规则**：
- 使用祈使句，现在时态："添加"而不是"添加了"
- 不要大写首字母
- 结尾不加句号
- 简洁明了

#### Body (正文)

可选，详细描述变更内容：

```
feat(backend): 添加 SQLite 持久化存储

- 创建 database_service.py 模块
- 实现线程和消息表
- 添加 CRUD 操作
- 集成到现有服务中

这个变更使得对话历史可以永久保存，
即使重启服务器也不会丢失数据。
```

**规则**：
- 与 subject 之间空一行
- 说明变更的原因、做了什么、影响是什么
- 可以分多段
- 每行不超过 72 个字符

#### Footer (页脚)

可选，用于关联 Issue 或说明破坏性变更：

```
feat(api): 重构用户 API

BREAKING CHANGE: 用户 API 端点从 /user 改为 /api/users

迁移指南:
- 将所有 /user 请求改为 /api/users
- 更新客户端代码

Closes #123
Fixes #456
Related to #789
```

**关键字**：
- `Closes #123` - 关闭 Issue
- `Fixes #123` - 修复 Issue
- `Related to #123` - 相关 Issue
- `BREAKING CHANGE:` - 破坏性变更

## 类型说明

### feat (新功能)

添加新功能或特性。

```bash
# 简单示例
git commit -m "feat: 添加用户注册功能"

# 带 scope
git commit -m "feat(auth): 添加邮箱验证"

# 完整示例
git commit -m "feat(backend): 添加流式聊天功能

- 实现 SSE 流式输出
- 支持实时显示 AI 回复
- 优化前端显示效果

Closes #123"
```

### fix (Bug 修复)

修复 Bug。

```bash
# 简单示例
git commit -m "fix: 修复登录失败问题"

# 带 scope
git commit -m "fix(frontend): 修复按钮点击无响应"

# 完整示例
git commit -m "fix(backend): 修复内存泄漏问题

问题描述:
长时间运行后内存持续增长，最终导致服务崩溃。

解决方案:
- 修复事件监听器未正确移除
- 添加定时清理机制
- 优化缓存策略

Fixes #456"
```

### docs (文档)

更新文档。

```bash
git commit -m "docs: 更新 README 安装说明"
git commit -m "docs(api): 添加 API 使用示例"
git commit -m "docs: 修复文档中的错别字"
```

### style (代码格式)

不影响代码功能的格式变更（空格、格式化、缺少分号等）。

```bash
git commit -m "style: 格式化代码"
git commit -m "style(backend): 统一代码缩进"
git commit -m "style: 移除多余的空行"
```

### refactor (重构)

既不是新功能也不是修复 Bug 的代码变更。

```bash
git commit -m "refactor: 重构用户服务"
git commit -m "refactor(database): 优化数据库连接管理"
git commit -m "refactor: 提取公共函数到 utils"
```

### perf (性能优化)

提升性能的代码变更。

```bash
git commit -m "perf: 优化数据库查询性能"
git commit -m "perf(frontend): 减少不必要的重渲染"
git commit -m "perf: 添加缓存机制"
```

### test (测试)

添加或修改测试。

```bash
git commit -m "test: 添加用户登录测试"
git commit -m "test(api): 增加 API 集成测试"
git commit -m "test: 修复失败的单元测试"
```

### build (构建)

影响构建系统或外部依赖的变更。

```bash
git commit -m "build: 升级 webpack 到 5.0"
git commit -m "build: 添加 TypeScript 支持"
git commit -m "build(deps): 更新依赖包"
```

### ci (持续集成)

修改 CI 配置文件和脚本。

```bash
git commit -m "ci: 添加 GitHub Actions 工作流"
git commit -m "ci: 优化测试流程"
git commit -m "ci: 添加自动部署脚本"
```

### chore (其他)

其他不修改源码或测试的变更。

```bash
git commit -m "chore: 更新 .gitignore"
git commit -m "chore: 添加 EditorConfig"
git commit -m "chore: 清理无用文件"
```

### revert (回退)

回退之前的提交。

```bash
git commit -m "revert: 回退 feat: 添加用户登录

This reverts commit abc123def456.

原因: 发现严重性能问题"
```

## 示例

### 示例 1: 简单的新功能

```bash
git commit -m "feat: 添加用户头像上传功能"
```

### 示例 2: 带 scope 的 Bug 修复

```bash
git commit -m "fix(auth): 修复 token 过期后无法刷新的问题"
```

### 示例 3: 完整的提交消息

```bash
git commit -m "feat(backend): 添加 SQLite 持久化存储

实现功能:
- 创建 database_service.py 模块
- 实现 threads 和 messages 表
- 添加完整的 CRUD 操作
- 集成到 thread_service 中

技术细节:
- 使用 SQLite 作为嵌入式数据库
- 实现连接池管理
- 添加事务支持
- 优化查询性能

影响:
- 对话历史可以永久保存
- 重启服务器后数据不丢失
- 支持更大规模的数据存储

Closes #124"
```

### 示例 4: 破坏性变更

```bash
git commit -m "feat(api): 重构用户 API 端点

BREAKING CHANGE: 用户 API 端点从 /user 改为 /api/v1/users

变更原因:
- 统一 API 路径规范
- 支持 API 版本控制
- 提高可维护性

迁移指南:
1. 将所有 /user 请求改为 /api/v1/users
2. 更新客户端 SDK
3. 更新文档

影响范围:
- 所有使用用户 API 的客户端
- 第三方集成

Closes #200"
```

### 示例 5: 多个 Issue

```bash
git commit -m "fix(frontend): 修复多个 UI 问题

- 修复按钮样式错位
- 修复表单验证提示不显示
- 修复移动端布局问题

Fixes #301, #302, #303"
```

## 最佳实践

### 1. 提交频率

- ✅ 每完成一个小功能就提交
- ✅ 每修复一个 Bug 就提交
- ❌ 不要积累太多变更一次性提交
- ❌ 不要提交未完成的代码

### 2. 提交粒度

- ✅ 一个提交只做一件事
- ✅ 相关的变更放在一起
- ❌ 不要在一个提交中混合多个不相关的变更
- ❌ 不要在一个提交中同时修复多个 Bug

### 3. 提交消息

- ✅ 清晰描述做了什么
- ✅ 说明为什么这样做
- ✅ 使用现在时态
- ❌ 不要使用模糊的描述
- ❌ 不要省略重要信息

### 4. 提交前检查

```bash
# 查看变更
git diff

# 查看暂存的变更
git diff --staged

# 查看状态
git status

# 部分提交
git add -p
```

### 5. 修改提交

```bash
# 修改最后一次提交
git commit --amend

# 修改提交消息
git commit --amend -m "新的提交消息"

# 交互式变基（修改历史提交）
git rebase -i HEAD~3
```

## 工具配置

### Commitlint

安装和配置 commitlint 来强制执行规范：

```bash
# 安装
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# 配置文件 commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72]
  }
};
```

### Husky

使用 Husky 在提交前自动检查：

```bash
# 安装
npm install --save-dev husky

# 初始化
npx husky install

# 添加 commit-msg hook
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
```

### Commitizen

使用 Commitizen 交互式生成规范的提交消息：

```bash
# 安装
npm install --save-dev commitizen cz-conventional-changelog

# 配置 package.json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}

# 使用
git cz
# 或
npm run commit
```

## 常见问题

### Q: 如何修改已经推送的提交消息？

```bash
# 修改最后一次提交
git commit --amend
git push --force-with-lease

# 修改历史提交
git rebase -i HEAD~3
# 将要修改的提交标记为 'reword'
git push --force-with-lease
```

### Q: 提交消息写错了怎么办？

```bash
# 如果还没推送
git commit --amend -m "正确的提交消息"

# 如果已经推送
git commit --amend -m "正确的提交消息"
git push --force-with-lease
```

### Q: 如何合并多个提交？

```bash
# 交互式变基
git rebase -i HEAD~3

# 将要合并的提交标记为 'squash' 或 's'
# 保存后编辑合并后的提交消息
```

### Q: 什么时候使用 BREAKING CHANGE？

当变更会导致现有功能不兼容时，必须使用 `BREAKING CHANGE:`：
- API 接口变更
- 配置格式变更
- 行为变更
- 删除功能

## 相关文档

- [分支管理规范](./BRANCH_MANAGEMENT.md)
- [Pull Request 规范](../../.github/pull_request_template.md)
- [发布流程](./RELEASE_PROCESS.md)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**文档版本**: v1.0.0  
**最后更新**: 2025-01-16  
**维护者**: 开发团队

