# 🚀 Git 工作流自动化指南

## 📋 快速开始

### 1. 设置脚本权限

```bash
chmod +x git-workflow.sh
```

### 2. 查看帮助

```bash
./git-workflow.sh help
```

---

## 🎯 常用场景

### 场景 1: 开发新功能

```bash
# 1. 创建新功能分支
./git-workflow.sh new chinese-ui

# 2. 开发代码...

# 3. 快速提交并推送
./git-workflow.sh quick "feat: 添加中文界面"

# 4. 继续开发...

# 5. 再次提交
./git-workflow.sh quick "feat: 完善中文翻译"

# 6. 功能完成，合并到 main
./git-workflow.sh merge
```

---

### 场景 2: 修复 Bug

```bash
# 1. 创建修复分支
./git-workflow.sh new fix-streaming-bug

# 2. 修复代码...

# 3. 提交并推送
./git-workflow.sh quick "fix: 修复流式输出 bug"

# 4. 合并到 main
./git-workflow.sh merge
```

---

### 场景 3: 长期功能开发（需要同步 main）

```bash
# 1. 创建功能分支
./git-workflow.sh new big-feature

# 2. 开发一段时间...
./git-workflow.sh quick "feat: 完成第一部分"

# 3. main 分支有新更新，需要同步
./git-workflow.sh update

# 4. 继续开发...
./git-workflow.sh quick "feat: 完成第二部分"

# 5. 再次同步 main
./git-workflow.sh update

# 6. 功能完成，合并
./git-workflow.sh merge
```

---

### 场景 4: 只更新 main 分支

```bash
# 同步远程 main 的最新更改
./git-workflow.sh sync
```

---

### 场景 5: 查看当前状态

```bash
# 查看分支、文件状态、最近提交
./git-workflow.sh status
```

---

## 📖 命令详解

### `new <name>` - 创建新功能分支

**功能**:
- 切换到 main 分支
- 更新 main 分支
- 创建新的 feature 分支

**用法**:
```bash
./git-workflow.sh new feature-name
```

**示例**:
```bash
./git-workflow.sh new chinese-ui
# 创建分支: feature/chinese-ui
```

---

### `commit <msg>` - 提交更改

**功能**:
- 显示当前更改
- 确认后暂存所有文件
- 提交更改

**用法**:
```bash
./git-workflow.sh commit "提交信息"
```

**示例**:
```bash
./git-workflow.sh commit "feat: 添加新功能"
```

---

### `push` - 推送当前分支

**功能**:
- 检查是否有未提交的更改
- 推送当前分支到远程

**用法**:
```bash
./git-workflow.sh push
```

---

### `quick <msg>` - 快速提交并推送

**功能**:
- 暂存所有更改
- 提交
- 推送到远程

**用法**:
```bash
./git-workflow.sh quick "提交信息"
```

**示例**:
```bash
./git-workflow.sh quick "fix: 修复 bug"
```

**⚡ 最常用的命令！**

---

### `merge` - 合并到 main

**功能**:
- 切换到 main 分支
- 更新 main 分支
- 合并当前功能分支
- 推送到远程
- 可选：删除功能分支

**用法**:
```bash
./git-workflow.sh merge
```

**交互式确认**:
- 确认是否合并
- 确认是否删除分支

---

### `sync` - 同步 main 分支

**功能**:
- 切换到 main 分支
- 拉取远程更新
- 切换回原分支

**用法**:
```bash
./git-workflow.sh sync
```

---

### `update` - 从 main 更新当前分支

**功能**:
- 拉取 main 的最新更改
- 使用 rebase 合并到当前分支

**用法**:
```bash
./git-workflow.sh update
```

**使用场景**:
- 功能分支开发时间较长
- main 分支有新的提交
- 需要同步最新代码

---

### `status` - 查看状态

**功能**:
- 显示当前分支
- 显示所有本地分支
- 显示文件状态
- 显示最近 5 次提交

**用法**:
```bash
./git-workflow.sh status
```

---

## 🔄 完整工作流示例

### 示例 1: 简单功能开发

```bash
# 1. 创建分支
./git-workflow.sh new add-button

# 2. 开发...

# 3. 提交并推送
./git-workflow.sh quick "feat: 添加按钮组件"

# 4. 合并到 main
./git-workflow.sh merge
```

**时间**: 约 2 分钟

---

### 示例 2: 复杂功能开发

```bash
# 1. 创建分支
./git-workflow.sh new refactor-backend

# 2. 第一阶段开发
./git-workflow.sh quick "refactor: 重构数据层"

# 3. 第二阶段开发
./git-workflow.sh quick "refactor: 重构 API 层"

# 4. 同步 main（如果 main 有更新）
./git-workflow.sh update

# 5. 第三阶段开发
./git-workflow.sh quick "refactor: 添加测试"

# 6. 合并到 main
./git-workflow.sh merge
```

**时间**: 根据开发时间而定

---

## 💡 最佳实践

### 1. 提交信息规范

使用语义化提交信息：

```bash
feat: 新功能
fix: Bug 修复
docs: 文档更新
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建、配置等
```

**示例**:
```bash
./git-workflow.sh quick "feat: 添加中文界面"
./git-workflow.sh quick "fix: 修复流式输出 bug"
./git-workflow.sh quick "docs: 更新 README"
```

---

### 2. 分支命名规范

```bash
feature/功能名称    # 新功能
fix/bug名称        # Bug 修复
docs/文档名称      # 文档更新
refactor/重构名称  # 代码重构
```

**示例**:
```bash
./git-workflow.sh new chinese-ui        # feature/chinese-ui
./git-workflow.sh new streaming-bug     # feature/streaming-bug
```

---

### 3. 频繁提交

```bash
# ✅ 好的做法：小步提交
./git-workflow.sh quick "feat: 添加登录表单"
./git-workflow.sh quick "feat: 添加表单验证"
./git-workflow.sh quick "feat: 添加错误提示"

# ❌ 不好的做法：一次性提交所有
./git-workflow.sh quick "feat: 完成登录功能"
```

---

### 4. 定期同步 main

```bash
# 每天开始工作前
./git-workflow.sh update

# 或者
./git-workflow.sh sync
```

---

## 🛠️ 故障排除

### 问题 1: 推送被拒绝

**错误信息**:
```
! [rejected] main -> main (non-fast-forward)
```

**解决方法**:
```bash
# 使用脚本自动处理
./git-workflow.sh sync
./git-workflow.sh merge
```

---

### 问题 2: 有未提交的更改

**错误信息**:
```
❌ 请先提交或暂存更改
```

**解决方法**:
```bash
# 快速提交
./git-workflow.sh quick "wip: 临时保存"

# 或者手动处理
git stash  # 暂存更改
# ... 执行其他操作 ...
git stash pop  # 恢复更改
```

---

### 问题 3: 合并冲突

**解决方法**:
```bash
# 1. 查看冲突文件
git status

# 2. 编辑冲突文件，删除冲突标记
# <<<<<<< HEAD
# 你的更改
# =======
# 远程的更改
# >>>>>>> branch-name

# 3. 标记为已解决
git add <冲突文件>

# 4. 继续合并
git commit -m "merge: 解决冲突"

# 5. 推送
./git-workflow.sh push
```

---

## 📊 命令对比

| 场景 | 传统命令 | 脚本命令 |
|------|---------|---------|
| **创建分支** | `git checkout main && git pull && git checkout -b feature/xxx` | `./git-workflow.sh new xxx` |
| **提交推送** | `git add -A && git commit -m "xxx" && git push` | `./git-workflow.sh quick "xxx"` |
| **合并到 main** | `git checkout main && git pull && git merge xxx && git push` | `./git-workflow.sh merge` |
| **同步 main** | `git checkout main && git pull && git checkout -` | `./git-workflow.sh sync` |
| **查看状态** | `git status && git log` | `./git-workflow.sh status` |

---

## 🎯 快速参考

```bash
# 创建新分支
./git-workflow.sh new <name>

# 快速提交推送（最常用）
./git-workflow.sh quick "message"

# 合并到 main
./git-workflow.sh merge

# 同步 main
./git-workflow.sh sync

# 从 main 更新
./git-workflow.sh update

# 查看状态
./git-workflow.sh status
```

---

## 🔗 相关文档

- [Git 官方文档](https://git-scm.com/doc)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [约定式提交](https://www.conventionalcommits.org/zh-hans/)

---

**创建时间**: 2025-10-04  
**版本**: 1.0.0

