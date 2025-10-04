# 🚀 Git 工作流快速参考

## ⚡ 最常用命令

```bash
# 1. 创建新功能分支
./git-workflow.sh new feature-name

# 2. 快速提交并推送（最常用！）
./git-workflow.sh quick "feat: 提交信息"

# 3. 合并到 main
./git-workflow.sh merge

# 4. 查看状态
./git-workflow.sh status
```

---

## 📋 完整命令列表

| 命令 | 说明 | 示例 |
|------|------|------|
| `new <name>` | 创建新功能分支 | `./git-workflow.sh new chinese-ui` |
| `quick <msg>` | 快速提交并推送 | `./git-workflow.sh quick "feat: 新功能"` |
| `commit <msg>` | 仅提交（不推送） | `./git-workflow.sh commit "fix: bug"` |
| `push` | 推送当前分支 | `./git-workflow.sh push` |
| `merge` | 合并到 main | `./git-workflow.sh merge` |
| `sync` | 同步 main 分支 | `./git-workflow.sh sync` |
| `update` | 从 main 更新当前分支 | `./git-workflow.sh update` |
| `status` | 查看状态 | `./git-workflow.sh status` |

---

## 🎯 典型工作流

### 场景 1: 快速修复

```bash
./git-workflow.sh new fix-bug
# 修复代码...
./git-workflow.sh quick "fix: 修复 xxx bug"
./git-workflow.sh merge
```

### 场景 2: 新功能开发

```bash
./git-workflow.sh new new-feature
# 开发...
./git-workflow.sh quick "feat: 完成第一部分"
# 继续开发...
./git-workflow.sh quick "feat: 完成第二部分"
./git-workflow.sh merge
```

### 场景 3: 长期开发（需要同步）

```bash
./git-workflow.sh new big-feature
./git-workflow.sh quick "feat: 第一阶段"
./git-workflow.sh update  # 同步 main 的更新
./git-workflow.sh quick "feat: 第二阶段"
./git-workflow.sh merge
```

---

## 💡 提交信息规范

```bash
feat:     新功能
fix:      Bug 修复
docs:     文档更新
refactor: 代码重构
perf:     性能优化
test:     测试相关
chore:    构建、配置等
```

**示例**:
```bash
./git-workflow.sh quick "feat: 添加中文界面"
./git-workflow.sh quick "fix: 修复流式输出 bug"
./git-workflow.sh quick "docs: 更新 README"
./git-workflow.sh quick "refactor: 重构后端代码"
```

---

## 🔧 故障排除

### 有未提交的更改

```bash
# 快速提交
./git-workflow.sh quick "wip: 临时保存"
```

### 需要同步 main

```bash
# 方法 1: 同步 main（不影响当前分支）
./git-workflow.sh sync

# 方法 2: 更新当前分支
./git-workflow.sh update
```

### 合并冲突

```bash
# 1. 编辑冲突文件
# 2. 解决冲突后
git add <文件>
git commit -m "merge: 解决冲突"
./git-workflow.sh push
```

---

## 📊 命令速查表

```
创建分支    → new
提交推送    → quick  ⭐ 最常用
仅提交      → commit
仅推送      → push
合并 main   → merge
同步 main   → sync
更新分支    → update
查看状态    → status
```

---

**快速帮助**: `./git-workflow.sh help`

