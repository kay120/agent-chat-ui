# 发布流程文档

## 📋 目录

- [发布准备](#发布准备)
- [发布流程](#发布流程)
- [发布检查清单](#发布检查清单)
- [回滚方案](#回滚方案)
- [发布后任务](#发布后任务)

## 发布准备

### 1. 确定发布内容

#### 收集变更
```bash
# 查看 dev 分支自上次发布以来的所有提交
git log v1.1.0..dev --oneline

# 查看具体变更
git log v1.1.0..dev --pretty=format:"%h - %s (%an, %ar)"
```

#### 分类整理
将变更按类型分类：
- ✨ 新功能 (Features)
- 🐛 Bug 修复 (Bug Fixes)
- 🚀 性能优化 (Performance)
- 📝 文档更新 (Documentation)
- ♻️ 重构 (Refactoring)
- 🔧 其他 (Chore)

### 2. 确定版本号

根据 [语义化版本](https://semver.org/) 规范：

| 变更类型 | 版本号 | 示例 |
|---------|--------|------|
| 破坏性变更 | 主版本 +1 | v1.2.3 → v2.0.0 |
| 新功能 | 次版本 +1 | v1.2.3 → v1.3.0 |
| Bug 修复 | 补丁版本 +1 | v1.2.3 → v1.2.4 |

### 3. 更新 CHANGELOG

编辑 `CHANGELOG.md`：

```markdown
## [v1.2.0] - 2025-01-16

### Added
- 流式聊天功能 (#123)
- SQLite 持久化存储 (#124)
- 模块化后端架构 (#125)

### Fixed
- 修复前端卡顿问题 (#126)
- 修复历史记录不更新 (#127)

### Changed
- 优化数据库查询性能
- 改进错误处理

### Deprecated
- 旧的单文件后端将在 v2.0.0 移除

### Security
- 修复 XSS 漏洞 (#128)
```

## 发布流程

### 步骤 1: 创建 Release 分支

```bash
# 1. 确保 master 分支是最新的
git checkout master
git pull origin master

# 2. 创建 release 分支（使用当前日期）
RELEASE_DATE=$(date +%Y-%m-%d)
git checkout -b release-${RELEASE_DATE}

# 示例: release-2025-01-16
git push origin release-${RELEASE_DATE}
```

### 步骤 2: 合并 dev 到 release

#### 创建 Pull Request

**PR 标题**：
```
Release 2025-01-16 - 版本 v1.2.0
```

**PR 描述**：
```markdown
## 发布信息
- **版本号**: v1.2.0
- **发布日期**: 2025-01-16
- **发布分支**: release-2025-01-16
- **基于版本**: v1.1.0

## 本次发布内容

### ✨ 新功能
1. **流式聊天功能** (#123)
   - 实现 SSE 流式输出
   - 支持实时显示 AI 回复

2. **SQLite 持久化** (#124)
   - 对话历史永久保存
   - 支持跨会话恢复

### 🐛 Bug 修复
1. **修复前端卡顿问题** (#126)
2. **修复历史记录不更新** (#127)

### 🔧 优化改进
1. 性能优化
2. 代码质量提升

## 数据库变更
- [x] 新增 `threads` 表
- [x] 新增 `messages` 表

## 配置变更
- [x] 新增 `SQLITE_DB_PATH` 环境变量

## 破坏性变更
- [ ] 无破坏性变更

## 测试情况
- [x] 本地测试通过
- [x] 集成测试通过
- [x] 性能测试通过

## Review 要求
**所有开发人员必须 Review 并 Approve**
@developer1 @developer2 @developer3
```

#### Review 和合并

1. 所有相关开发人员 Review
2. 至少 2 人 Approve
3. 所有 CI 测试通过
4. 合并到 release 分支

### 步骤 3: Release 分支测试

#### 部署到测试环境

```bash
# 切换到 release 分支
git checkout release-2025-01-16

# 部署到测试环境
./deploy-test.sh
```

#### 测试清单

- [ ] **功能测试**
  - [ ] 所有新功能正常工作
  - [ ] 所有修复的 Bug 已解决
  - [ ] 无新的 Bug 引入

- [ ] **性能测试**
  - [ ] 响应时间符合要求
  - [ ] 内存使用正常
  - [ ] 数据库查询优化

- [ ] **兼容性测试**
  - [ ] 浏览器兼容性
  - [ ] 移动端兼容性
  - [ ] API 向后兼容

- [ ] **安全测试**
  - [ ] 无安全漏洞
  - [ ] 权限控制正常
  - [ ] 数据加密正常

#### 发现问题的处理

如果在测试中发现问题：

```bash
# 直接在 release 分支修复
git checkout release-2025-01-16

# 修复问题
git add .
git commit -m "fix: 修复发布前发现的登录问题"
git push origin release-2025-01-16

# 重新测试
```

### 步骤 4: 合并到 master

#### 创建 Pull Request

**PR 标题**：
```
🚀 Release v1.2.0 - 2025-01-16
```

**PR 描述**：
```markdown
## 发布信息
- **版本**: v1.2.0
- **发布日期**: 2025-01-16
- **发布分支**: release-2025-01-16
- **测试状态**: ✅ 全部通过

## 发布说明
本次发布包含 3 个新功能、2 个 Bug 修复和多项性能优化。

详细变更请查看: [CHANGELOG.md](./CHANGELOG.md)

## 部署检查清单
- [x] 数据库备份完成
- [x] 环境变量配置完成
- [x] 依赖包更新完成
- [x] 静态资源构建完成
- [x] 回滚方案准备完成

## 合并后操作
1. 打标签: `git tag -a v1.2.0 -m "Release v1.2.0"`
2. 推送标签: `git push origin v1.2.0`
3. 同步到 dev: `git checkout dev && git merge master`
4. 发布 Release Notes

## Approve 要求
需要至少 2 名 Maintainer Approve
```

#### Review 和合并

1. 至少 2 名 Maintainer Review
2. 确认所有测试通过
3. 确认部署检查清单完成
4. 合并到 master

### 步骤 5: 打标签

```bash
# 1. 切换到 master 并更新
git checkout master
git pull origin master

# 2. 创建带注释的标签
git tag -a v1.2.0 -m "Release v1.2.0 - 2025-01-16

新功能:
- 流式聊天功能
- SQLite 持久化
- 模块化后端架构

Bug 修复:
- 修复前端卡顿问题
- 修复历史记录不更新

性能优化:
- 优化数据库查询
- 添加内存缓存
"

# 3. 推送标签到远程
git push origin v1.2.0

# 4. 验证标签
git tag -l -n9 v1.2.0
```

### 步骤 6: 部署到生产环境

```bash
# 1. 备份当前生产环境
./backup-production.sh

# 2. 部署新版本
./deploy-production.sh v1.2.0

# 3. 验证部署
./verify-deployment.sh
```

### 步骤 7: 同步到 dev

```bash
# 1. 将 release 分支的修复同步回 dev
git checkout dev
git pull origin dev
git merge release-2025-01-16

# 2. 解决冲突（如果有）
# 3. 推送到远程
git push origin dev
```

### 步骤 8: 发布 Release Notes

在 GitHub/GitLab 上创建 Release：

1. 进入 Releases 页面
2. 点击 "Draft a new release"
3. 填写信息：
   - **Tag**: v1.2.0
   - **Title**: v1.2.0 - 2025-01-16
   - **Description**: 从 CHANGELOG.md 复制内容
4. 发布

### 步骤 9: 清理（可选）

```bash
# 删除本地 release 分支
git branch -d release-2025-01-16

# 删除远程 release 分支
git push origin --delete release-2025-01-16
```

## 发布检查清单

### 发布前检查

- [ ] **代码准备**
  - [ ] 所有功能已合并到 dev
  - [ ] 所有测试通过
  - [ ] 代码 Review 完成
  - [ ] CHANGELOG.md 已更新
  - [ ] 版本号已确定

- [ ] **环境准备**
  - [ ] 测试环境可用
  - [ ] 生产环境备份完成
  - [ ] 数据库迁移脚本准备
  - [ ] 回滚方案准备

- [ ] **文档准备**
  - [ ] API 文档已更新
  - [ ] 用户文档已更新
  - [ ] 部署文档已更新
  - [ ] Release Notes 草稿完成

### 发布中检查

- [ ] **测试验证**
  - [ ] 功能测试通过
  - [ ] 性能测试通过
  - [ ] 安全测试通过
  - [ ] 兼容性测试通过

- [ ] **部署验证**
  - [ ] 数据库迁移成功
  - [ ] 服务启动正常
  - [ ] 健康检查通过
  - [ ] 监控指标正常

### 发布后检查

- [ ] **功能验证**
  - [ ] 核心功能正常
  - [ ] 新功能可用
  - [ ] Bug 已修复

- [ ] **监控检查**
  - [ ] 错误日志正常
  - [ ] 性能指标正常
  - [ ] 用户反馈正常

- [ ] **文档发布**
  - [ ] Release Notes 已发布
  - [ ] 用户通知已发送
  - [ ] 文档已更新

## 回滚方案

### 何时回滚

- 发现严重 Bug
- 性能严重下降
- 数据丢失或损坏
- 服务不可用

### 回滚步骤

```bash
# 1. 停止当前服务
./stop-service.sh

# 2. 恢复数据库备份
./restore-database.sh

# 3. 回滚到上一个版本
git checkout v1.1.0
./deploy-production.sh v1.1.0

# 4. 验证服务
./verify-deployment.sh

# 5. 通知团队
# 发送回滚通知
```

### 回滚后处理

1. 分析回滚原因
2. 修复问题
3. 重新测试
4. 准备下一次发布

## 发布后任务

### 1. 监控

```bash
# 监控错误日志
tail -f /var/log/app/error.log

# 监控性能指标
./monitor-performance.sh

# 监控用户反馈
./check-user-feedback.sh
```

### 2. 通知

- [ ] 通知团队发布完成
- [ ] 通知用户新版本可用
- [ ] 更新状态页面

### 3. 文档

- [ ] 更新版本历史
- [ ] 归档发布文档
- [ ] 总结经验教训

### 4. 清理

- [ ] 删除临时分支
- [ ] 清理测试数据
- [ ] 归档日志文件

## 紧急修复流程 (Hotfix)

### 何时使用 Hotfix

- 生产环境严重 Bug
- 安全漏洞
- 数据丢失风险
- 服务不可用

### Hotfix 流程

```bash
# 1. 从 master 创建 hotfix 分支
git checkout master
git pull origin master
git checkout -b hotfix/critical-issue

# 2. 修复问题
git add .
git commit -m "hotfix: 修复严重安全漏洞"
git push origin hotfix/critical-issue

# 3. 创建 PR 到 master
# 标题: "🚨 Hotfix v1.2.1 - 紧急安全修复"

# 4. 快速 Review 和合并

# 5. 打补丁标签
git checkout master
git pull origin master
git tag -a v1.2.1 -m "Hotfix v1.2.1 - 紧急安全修复"
git push origin v1.2.1

# 6. 部署到生产环境
./deploy-production.sh v1.2.1

# 7. 同步到 dev
git checkout dev
git merge hotfix/critical-issue
git push origin dev
```

## 常见问题

### Q: 发布过程中发现问题怎么办？

A: 在 release 分支直接修复，重新测试后继续发布流程。

### Q: 如何处理数据库迁移？

A: 
1. 准备迁移脚本
2. 在测试环境验证
3. 备份生产数据库
4. 执行迁移
5. 验证数据完整性

### Q: 发布失败如何回滚？

A: 参考 [回滚方案](#回滚方案) 章节。

### Q: 多个功能同时发布怎么办？

A: 都合并到 dev，然后一起发布。如果某个功能不稳定，可以先从 dev 移除。

## 相关文档

- [分支管理规范](./BRANCH_MANAGEMENT.md)
- [Pull Request 模板](../../.github/pull_request_template.md)
- [Commit 规范](./COMMIT_CONVENTION.md)
- [Code Review 指南](./CODE_REVIEW_GUIDE.md)

---

**文档版本**: v1.0.0  
**最后更新**: 2025-01-16  
**维护者**: 开发团队

