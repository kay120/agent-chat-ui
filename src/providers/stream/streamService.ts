import { flushSync } from "react-dom";
import { type Message } from "@langchain/langgraph-sdk";
import type { MutableRefObject } from "react";

interface StreamServiceConfig {
  apiUrl: string;
  requestThreadId: string | null;
  inputMessages: Message[];
  currentThreadIdRef: MutableRefObject<string | null>;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentRunId: (runId: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  setCurrentStreamThreadId: (threadId: string | null) => void;
  setThreadId: (threadId: string | null) => void;
  updateBackground: (threadId: string, messages: Message[]) => void;
  removeFromBackground: (threadId: string) => void;
  onThreadsRefresh: () => Promise<void>;
}

/**
 * 流式处理服务
 * 处理与后端的流式通信
 */
export class StreamService {
  private config: StreamServiceConfig;

  constructor(config: StreamServiceConfig) {
    this.config = config;
  }

  /**
   * 执行流式请求
   */
  async execute(): Promise<void> {
    const {
      apiUrl,
      requestThreadId,
      inputMessages,
      currentThreadIdRef,
      setMessages,
      setIsLoading,
      setCurrentRunId,
      setAbortController,
      setCurrentStreamThreadId,
      setThreadId,
      updateBackground,
      removeFromBackground,
      onThreadsRefresh,
    } = this.config;

    setIsLoading(true);
    setCurrentStreamThreadId(requestThreadId);
    console.log('🚀 开始流式请求，线程ID:', requestThreadId);

    // 设置用户消息
    setMessages(inputMessages);

    // 准备AI消息
    const aiMessageId = `ai-${Date.now()}`;
    let aiContent = "";

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);

    // 生成一个临时的 run_id，以防后端没有返回
    const tempRunId = `temp-${Date.now()}`;
    setCurrentRunId(tempRunId);
    console.log('🆔 设置临时 Run ID:', tempRunId);

    // 🆕 立即刷新历史记录列表（在开始流式输出时）
    console.log('🔄 开始流式输出，立即刷新历史记录...');
    try {
      await onThreadsRefresh();
      console.log('✅ 历史记录已刷新（开始时）');
    } catch (error) {
      console.error('❌ 刷新历史记录失败（开始时）:', error);
    }

    try {
      const requestBody = {
        input: {
          messages: inputMessages.map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content
          }))
        }
      };

      const response = await fetch(`${apiUrl}/runs/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      // 从响应头获取 run_id 和 thread_id
      const runId = response.headers.get('X-Run-ID');
      const responseThreadId = response.headers.get('X-Thread-ID');
      if (runId) {
        setCurrentRunId(runId);
        console.log('📍 更新为真实 Run ID:', runId);
      } else {
        console.log('⚠️ 后端未返回 Run ID，使用临时 ID:', tempRunId);
      }
      if (responseThreadId) {
        console.log('📍 获取到 Thread ID:', responseThreadId);
      }

      // 使用请求开始时的threadId，不受后续threadId变化影响
      console.log('🔒 流式处理锁定到线程:', requestThreadId);

      if (!response.body) {
        throw new Error('没有响应体');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('📦 收到流式数据:', data);

              // 处理 LangGraph SDK 格式
              if (data.event === 'values' && data.data && data.data.messages) {
                const messages = data.data.messages;
                const lastMessage = messages[messages.length - 1];

                if (lastMessage && lastMessage.type === 'ai' && lastMessage.content) {
                  // 这是AI的回复内容
                  const newContent = lastMessage.content;
                  console.log('🤖 收到AI回复片段:', newContent);

                  // 累积内容 - LangGraph 发送的是增量内容，需要累积
                  aiContent += newContent;
                  console.log('📝 累积AI内容，新增:', newContent, '总长度:', aiContent.length);

                  // 更新消息
                  this.updateMessages(
                    requestThreadId,
                    inputMessages,
                    aiMessageId,
                    aiContent,
                    currentThreadIdRef,
                    setMessages,
                    updateBackground
                  );
                }
              }

              // 处理线程ID（保持原有逻辑以防需要）
              if (data.type === 'thread_id' && data.thread_id) {
                console.log('📍 从流式响应获取到 Thread ID:', data.thread_id);
                // 如果当前没有线程ID，设置新的线程ID
                if (!requestThreadId) {
                  setThreadId(data.thread_id);
                  console.log('✅ 设置新线程ID:', data.thread_id);
                }
              }

            } catch (e) {
              console.error('解析数据失败:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 请求被用户取消');
      } else {
        console.error('请求失败:', error);
      }
    } finally {
      // 刷新历史记录列表（后端已经保存了对话）
      console.log('🔄 刷新历史记录列表...');
      try {
        await onThreadsRefresh();
        console.log('✅ 历史记录已刷新');
      } catch (error) {
        console.error('❌ 刷新历史记录失败:', error);
      }

      // 清理后台线程数据（流式请求已完成）
      if (requestThreadId) {
        removeFromBackground(requestThreadId);
      }

      setIsLoading(false);
      setCurrentRunId(null);
      setAbortController(null);
      setCurrentStreamThreadId(null);
      console.log('🏁 流式请求完成，清理状态');
    }
  }

  /**
   * 更新消息（前台或后台）
   */
  private updateMessages(
    requestThreadId: string | null,
    inputMessages: Message[],
    aiMessageId: string,
    aiContent: string,
    currentThreadIdRef: MutableRefObject<string | null>,
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void,
    updateBackground: (threadId: string, messages: Message[]) => void
  ): void {
    const updateMessages = (prevMessages: Message[]) => {
      const newMessages = [...prevMessages];

      // 查找或创建AI消息
      let aiMessageIndex = newMessages.findIndex(
        msg => msg.id === aiMessageId && msg.type === 'ai'
      );

      if (aiMessageIndex === -1) {
        // 创建新的AI消息
        newMessages.push({
          id: aiMessageId,
          type: 'ai',
          content: aiContent
        });
      } else {
        // 更新现有AI消息
        newMessages[aiMessageIndex] = {
          ...newMessages[aiMessageIndex],
          content: aiContent
        };
      }

      return newMessages;
    };

    // 总是更新后台线程数据
    if (requestThreadId) {
      const currentBackgroundMessages = inputMessages;
      const updatedMessages = updateMessages(currentBackgroundMessages);
      updateBackground(requestThreadId, updatedMessages);

      // 只有当前显示的是这个线程时，才更新界面
      const currentDisplayThreadId = currentThreadIdRef.current;
      if (currentDisplayThreadId === requestThreadId) {
        // 当前显示的就是这个线程，更新界面
        flushSync(() => {
          setMessages(updatedMessages);
        });
        console.log('🖥️ 更新前台界面:', requestThreadId, '消息数:', updatedMessages.length);
      } else {
        // 当前显示的是其他线程，只更新后台数据
        console.log('🔄 仅更新后台线程:', requestThreadId, '当前显示:', currentDisplayThreadId, '消息数:', updatedMessages.length);
      }
    }
  }
}

