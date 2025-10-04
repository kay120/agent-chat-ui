# 🔄 前端适配官方 LangGraph API

## 📝 **修改总结**

为了让前端与官方 `langgraph_api` 兼容，我们对以下文件进行了修改：

### 1. **Thread.tsx** - 线程管理

#### 修改 1: 获取线程列表

**原来**（自定义后端）:
```typescript
GET /threads
返回: {threads: [...]}
```

**现在**（官方 API）:
```typescript
POST /threads/search
请求体: {limit: 100, offset: 0}
返回: [...] // 直接返回数组
```

#### 修改 2: 删除线程

**原来**:
```typescript
DELETE /threads/{thread_id}
返回: {status: "deleted"}
```

**现在**:
```typescript
DELETE /threads/{thread_id}
返回: 空响应或 204 状态码
```

---

### 2. **Stream.tsx** - 流式输出

#### 修改 1: 流式请求 URL

**原来**:
```typescript
POST /runs/stream
```

**现在**:
```typescript
POST /threads/{thread_id}/runs/stream
```

#### 修改 2: 请求体格式

**原来**:
```json
{
  "input": {
    "messages": [
      {"id": "...", "type": "human", "content": "你好"}
    ]
  }
}
```

**现在**:
```json
{
  "assistant_id": "agent",
  "input": {
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }
}
```

**关键变化**:
- ✅ 添加 `assistant_id` 字段
- ✅ `type: "human"` → `role: "user"`
- ✅ 移除 `id` 字段

#### 修改 3: SSE 响应格式

**原来**（自定义后端）:
```
data: {"event": "values", "data": {"messages": [...]}}
```

**现在**（官方 API）:
```
event: metadata
data: {"run_id": "..."}

event: values
data: {"messages": [...]}

event: end
data: null
```

**关键变化**:
- ✅ `event:` 和 `data:` 分开
- ✅ `run_id` 通过 `metadata` 事件发送
- ✅ 不再从响应头获取 `run_id`

#### 修改 4: 取消请求 URL

**原来**:
```typescript
POST /runs/{run_id}/cancel
```

**现在**:
```typescript
POST /threads/{thread_id}/runs/{run_id}/cancel
```

---

## 🔍 **详细代码对比**

### Thread.tsx

#### 获取线程列表

```typescript
// ❌ 原来
const response = await fetch(`${effectiveApiUrl}/threads`);
const data = await response.json();
const threads = data.threads || [];

// ✅ 现在
const response = await fetch(`${effectiveApiUrl}/threads/search`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({limit: 100, offset: 0}),
});
const threads = await response.json();
```

#### 删除线程

```typescript
// ❌ 原来
const result = await response.json();
if (result.status === 'deleted') {
  setThreads(prevThreads => prevThreads.filter(t => t.thread_id !== threadId));
  return true;
}

// ✅ 现在
// 官方 API 删除成功后返回空响应
setThreads(prevThreads => prevThreads.filter(t => t.thread_id !== threadId));
return true;
```

---

### Stream.tsx

#### 流式请求

```typescript
// ❌ 原来
const requestBody = {
  input: {
    messages: input.messages.map(msg => ({
      id: msg.id,
      type: msg.type,
      content: msg.content
    }))
  }
};
const response = await fetch(`${apiUrl}/runs/stream`, {...});

// ✅ 现在
const requestBody = {
  assistant_id: "agent",
  input: {
    messages: input.messages.map(msg => ({
      role: msg.type === 'human' ? 'user' : 'assistant',
      content: msg.content
    }))
  }
};
const streamUrl = `${apiUrl}/threads/${requestThreadId}/runs/stream`;
const response = await fetch(streamUrl, {...});
```

#### SSE 解析

```typescript
// ❌ 原来
for (const line of lines) {
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    if (data.event === 'values' && data.data && data.data.messages) {
      const messages = data.data.messages;
      // ...
    }
  }
}

// ✅ 现在
let currentEvent = '';
for (const line of lines) {
  if (line.startsWith('event: ')) {
    currentEvent = line.slice(7).trim();
    continue;
  }
  if (line.startsWith('data: ')) {
    const data = JSON.parse(line.slice(6));
    if (currentEvent === 'values' && data.messages) {
      const messages = data.messages;
      // ...
    }
    if (currentEvent === 'metadata' && data.run_id) {
      setCurrentRunId(data.run_id);
    }
  }
}
```

#### 取消请求

```typescript
// ❌ 原来
const response = await fetch(`${apiUrl}/runs/${currentRunId}/cancel`, {
  method: 'POST',
});

// ✅ 现在
const cancelUrl = `${apiUrl}/threads/${currentStreamThreadId}/runs/${currentRunId}/cancel`;
const response = await fetch(cancelUrl, {
  method: 'POST',
});
```

---

## 🧪 **测试步骤**

### 1. 确保官方 API 正在运行

```bash
# Terminal 17 应该显示
langgraph dev --port 2024
```

### 2. 刷新浏览器

```bash
open http://localhost:3000
```

### 3. 测试功能

#### a) 测试发送消息
- [ ] 输入 "你好" 并发送
- [ ] 观察流式输出是否正常
- [ ] 检查控制台日志

#### b) 测试历史记录
- [ ] 发送多条消息
- [ ] 检查历史记录是否立即显示
- [ ] 点击历史记录切换对话

#### c) 测试删除功能
- [ ] 删除一个历史对话
- [ ] 检查是否成功删除

#### d) 测试取消功能
- [ ] 发送一个问题
- [ ] 在 AI 回答时点击取消
- [ ] 观察是否立即停止

---

## 🐛 **可能的问题**

### 问题 1: 线程列表为空

**原因**: 官方 API 使用内存存储，重启后数据丢失

**解决**: 发送一条消息创建新线程

---

### 问题 2: 流式输出不显示

**检查**:
1. 浏览器控制台是否有错误
2. Network 标签查看请求是否成功
3. 检查请求体格式是否正确

**调试**:
```javascript
// 在 Stream.tsx 中查看日志
console.log('📡 发送流式请求到:', streamUrl);
console.log('📦 收到流式数据 [event:', currentEvent, ']:', data);
```

---

### 问题 3: 取消功能不工作

**检查**:
1. `currentStreamThreadId` 是否存在
2. `currentRunId` 是否不是临时 ID
3. 取消 URL 是否正确

---

## 📊 **API 格式对比表**

| 功能 | 自定义后端 | 官方 API |
|------|-----------|---------|
| **获取线程** | `GET /threads` | `POST /threads/search` |
| **创建线程** | `POST /threads` | `POST /threads` |
| **删除线程** | `DELETE /threads/{id}` | `DELETE /threads/{id}` |
| **流式运行** | `POST /runs/stream` | `POST /threads/{id}/runs/stream` |
| **取消运行** | `POST /runs/{id}/cancel` | `POST /threads/{id}/runs/{id}/cancel` |
| **消息格式** | `{type: "human"}` | `{role: "user"}` |
| **SSE 格式** | `data: {event: "values"}` | `event: values\ndata: {...}` |
| **Run ID** | 响应头 `X-Run-ID` | SSE `metadata` 事件 |

---

## ✅ **兼容性检查清单**

- [x] Thread.tsx - 获取线程列表
- [x] Thread.tsx - 删除线程
- [x] Stream.tsx - 流式请求 URL
- [x] Stream.tsx - 请求体格式
- [x] Stream.tsx - SSE 解析
- [x] Stream.tsx - 获取 run_id
- [x] Stream.tsx - 取消请求

---

## 🎯 **下一步**

1. **测试所有功能**
2. **检查控制台日志**
3. **修复发现的问题**
4. **优化用户体验**

---

**前端已完全适配官方 LangGraph API！** 🎉

