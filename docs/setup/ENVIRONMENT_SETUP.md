# 🔐 环境变量配置指南

**目标**: 安全地配置 API Key，避免泄露到 Git 仓库

---

## 📋 为什么使用系统环境变量？

✅ **安全性**: API Key 不会出现在代码或配置文件中  
✅ **便捷性**: 所有项目共享同一个 API Key  
✅ **不会泄露**: 不会被误提交到 Git 仓库  
✅ **团队协作**: 每个开发者使用自己的 API Key  

---

## 🚀 配置步骤

### 方式 1: 系统环境变量（推荐）

#### macOS / Linux

**1. 编辑配置文件**:

```bash
# 如果使用 bash
nano ~/.bash_profile

# 如果使用 zsh (macOS 默认)
nano ~/.zshrc
```

**2. 添加环境变量**:

```bash
# DeepSeek API Key
export DEEPSEEK_API_KEY=sk-your-actual-api-key-here

# 可选：其他配置
export DEEPSEEK_MODEL=deepseek-chat
export DEEPSEEK_BASE_URL=https://api.deepseek.com
export DEEPSEEK_MAX_TOKENS=8000
export DEEPSEEK_TEMPERATURE=0.7
```

**3. 保存并生效**:

```bash
# 如果使用 bash
source ~/.bash_profile

# 如果使用 zsh
source ~/.zshrc
```

**4. 验证配置**:

```bash
# 检查环境变量是否设置成功
echo $DEEPSEEK_API_KEY

# 应该输出: sk-your-actual-api-key-here
```

---

#### Windows

**1. 打开环境变量设置**:

- 右键"此电脑" → "属性"
- 点击"高级系统设置"
- 点击"环境变量"

**2. 添加用户变量**:

- 点击"新建"
- 变量名: `DEEPSEEK_API_KEY`
- 变量值: `sk-your-actual-api-key-here`

**3. 重启终端**:

- 关闭所有终端窗口
- 重新打开终端

**4. 验证配置**:

```cmd
# PowerShell
echo $env:DEEPSEEK_API_KEY

# CMD
echo %DEEPSEEK_API_KEY%
```

---

### 方式 2: .env 文件（不推荐）

如果你不想使用系统环境变量，可以在 `.env` 文件中配置：

**1. 复制模板**:

```bash
cd agent-chat-ui
cp .env.example .env
```

**2. 编辑 .env**:

```bash
nano .env
```

**3. 添加 API Key**:

```bash
# 取消注释并填入你的 API Key
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
```

**⚠️ 注意**:
- `.env` 文件已在 `.gitignore` 中，不会被提交
- 但仍然存在误提交的风险
- 推荐使用系统环境变量

---

## 🔍 验证配置

### 方法 1: 命令行验证

```bash
# 检查环境变量
echo $DEEPSEEK_API_KEY

# 应该输出你的 API Key
```

### 方法 2: Python 验证

```python
import os

api_key = os.getenv("DEEPSEEK_API_KEY")
if api_key:
    print(f"✅ API Key 已配置: {api_key[:10]}...")
else:
    print("❌ API Key 未配置")
```

### 方法 3: 启动项目验证

```bash
cd agent-chat-ui
langgraph dev
```

如果看到：
```
✅ 已初始化 DeepSeek 模型: deepseek-chat
   - max_tokens: 8000
   - temperature: 0.7
```

说明配置成功！

---

## 📊 环境变量优先级

应用会按以下顺序读取配置：

1. **系统环境变量** (最高优先级)
2. `.env` 文件
3. 代码中的默认值 (最低优先级)

**示例**:

```python
# graph.py 中的读取逻辑
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY", "")
# 1. 先从系统环境变量读取
# 2. 如果没有，从 .env 文件读取
# 3. 如果都没有，使用空字符串（会报错）
```

---

## 🔒 安全最佳实践

### ✅ 推荐做法

1. **使用系统环境变量**
   ```bash
   export DEEPSEEK_API_KEY=sk-xxx
   ```

2. **不要在代码中硬编码**
   ```python
   # ❌ 错误
   api_key = "sk-xxx"
   
   # ✅ 正确
   api_key = os.getenv("DEEPSEEK_API_KEY")
   ```

3. **确保 .env 在 .gitignore 中**
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

4. **使用 .env.example 作为模板**
   ```bash
   # .env.example (可以提交)
   DEEPSEEK_API_KEY=your-api-key-here
   
   # .env (不提交)
   DEEPSEEK_API_KEY=sk-actual-key
   ```

---

### ❌ 避免做法

1. **不要在代码中硬编码 API Key**
   ```python
   # ❌ 危险！会泄露到 Git
   DEEPSEEK_API_KEY = "sk-dba4d0f1ee754dba9be2debdb1b410f2"
   ```

2. **不要在文档中包含真实 API Key**
   ```markdown
   # ❌ 危险！
   DEEPSEEK_API_KEY=sk-dba4d0f1ee754dba9be2debdb1b410f2
   
   # ✅ 正确
   DEEPSEEK_API_KEY=sk-your-api-key-here
   ```

3. **不要提交 .env 文件**
   ```bash
   # 检查 .gitignore
   cat .gitignore | grep .env
   ```

---

## 🛠️ 常见问题

### Q1: 为什么我的 API Key 不生效？

**A**: 检查以下几点：

1. 环境变量是否正确设置
   ```bash
   echo $DEEPSEEK_API_KEY
   ```

2. 是否重启了终端
   ```bash
   source ~/.bash_profile  # 或 ~/.zshrc
   ```

3. 是否在正确的 shell 配置文件中设置
   ```bash
   # 查看当前使用的 shell
   echo $SHELL
   
   # /bin/bash → 编辑 ~/.bash_profile
   # /bin/zsh  → 编辑 ~/.zshrc
   ```

---

### Q2: 如何在不同项目中使用不同的 API Key？

**A**: 使用 `.env` 文件：

```bash
# 项目 A
cd project-a
echo "DEEPSEEK_API_KEY=sk-key-a" > .env

# 项目 B
cd project-b
echo "DEEPSEEK_API_KEY=sk-key-b" > .env
```

---

### Q3: 如何在 Docker 中使用环境变量？

**A**: 使用 `docker run -e` 或 `docker-compose.yml`：

```bash
# docker run
docker run -e DEEPSEEK_API_KEY=$DEEPSEEK_API_KEY my-app

# docker-compose.yml
services:
  app:
    environment:
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
```

---

### Q4: 如何检查是否误提交了 API Key？

**A**: 使用 Git 历史搜索：

```bash
# 搜索 Git 历史中的 API Key
git log -p | grep -i "sk-"

# 如果发现泄露，需要：
# 1. 立即撤销 API Key
# 2. 生成新的 API Key
# 3. 清理 Git 历史
```

---

## 📝 配置清单

完成以下步骤确保配置正确：

- [ ] 在 `~/.bash_profile` 或 `~/.zshrc` 中添加 `DEEPSEEK_API_KEY`
- [ ] 执行 `source ~/.bash_profile` 或 `source ~/.zshrc`
- [ ] 验证环境变量：`echo $DEEPSEEK_API_KEY`
- [ ] 确保 `.env` 在 `.gitignore` 中
- [ ] 删除代码中所有硬编码的 API Key
- [ ] 启动项目验证配置生效

---

## 🎉 总结

**推荐配置方式**:

```bash
# 1. 编辑 shell 配置文件
nano ~/.zshrc  # 或 ~/.bash_profile

# 2. 添加环境变量
export DEEPSEEK_API_KEY=sk-your-actual-api-key-here

# 3. 生效配置
source ~/.zshrc

# 4. 验证
echo $DEEPSEEK_API_KEY

# 5. 启动项目
cd agent-chat-ui
langgraph dev
```

**安全原则**:
- ✅ 使用系统环境变量
- ✅ 不在代码中硬编码
- ✅ 不提交 .env 文件
- ✅ 定期更换 API Key

---

**文档创建时间**: 2025-10-02  
**推荐方式**: ✅ **系统环境变量**

