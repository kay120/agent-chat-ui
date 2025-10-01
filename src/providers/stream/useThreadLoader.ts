import { useEffect, useRef } from "react";
import { type Message } from "@langchain/langgraph-sdk";

interface UseThreadLoaderProps {
  threadId: string | null;
  isLoading: boolean;
  messages: Message[];
  apiUrl: string;
  setMessages: (messages: Message[]) => void;
  saveToBackground: (threadId: string, messages: Message[]) => void;
  getFromBackground: (threadId: string) => Message[] | undefined;
}

/**
 * 线程加载逻辑 Hook
 * 处理线程切换时的消息加载
 */
export function useThreadLoader({
  threadId,
  isLoading,
  messages,
  apiUrl,
  setMessages,
  saveToBackground,
  getFromBackground,
}: UseThreadLoaderProps) {
  // 用一个 ref 来跟踪上一个 threadId
  const prevThreadIdRef = useRef<string | null>(threadId);

  // 用一个 ref 来实时跟踪当前的 threadId（不受 useEffect 延迟影响）
  const currentThreadIdRef = useRef<string | null>(threadId);

  // 同步更新 currentThreadIdRef
  useEffect(() => {
    currentThreadIdRef.current = threadId;
  }, [threadId]);

  /**
   * 从后端加载线程消息
   */
  const loadThreadMessages = async (selectedThreadId: string) => {
    try {
      console.log('📥 加载线程消息:', selectedThreadId);
      const response = await fetch(`${apiUrl}/threads`);
      if (!response.ok) {
        throw new Error('获取线程失败');
      }
      const data = await response.json();
      // 后端返回的是 {threads: [...]} 格式
      const threadsList = data.threads || data;
      console.log('📋 获取到线程列表:', threadsList);

      const selectedThread = threadsList.find((t: any) => t.thread_id === selectedThreadId);

      if (selectedThread && selectedThread.values && selectedThread.values.messages) {
        const threadMessages = selectedThread.values.messages.map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}`,
          type: msg.type,
          content: msg.content,
        }));
        setMessages(threadMessages);
        console.log('✅ 成功加载线程消息:', threadMessages.length, '条');
      } else {
        console.log('⚠️ 线程消息为空或不存在，即将清空消息！');
        console.log('🔍 selectedThread:', selectedThread);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ 加载线程消息失败，即将清空消息:', error);
      setMessages([]);
    }
  };

  // 当 threadId 改变时处理消息加载
  useEffect(() => {
    const prevThreadId = prevThreadIdRef.current;
    console.log('🔍 useEffect 触发:', {
      prevThreadId,
      threadId,
      isLoading,
      messagesLength: messages.length
    });

    // 如果 threadId 没有变化，不要重新加载
    if (prevThreadId === threadId) {
      console.log('📝 threadId 未变化，跳过加载');
      return;
    }

    // 如果之前的线程正在加载，保存当前消息到后台线程映射
    if (prevThreadId && isLoading) {
      saveToBackground(prevThreadId, messages);
    }

    // 更新 ref
    prevThreadIdRef.current = threadId;

    // 如果 threadId 变为 null（新建对话）
    if (threadId === null) {
      setMessages([]);
      console.log('🆕 新建对话，清空消息历史');
      return;
    }

    // 检查是否有后台运行的线程数据
    const backgroundMessages = getFromBackground(threadId);
    if (backgroundMessages) {
      setMessages(backgroundMessages);
      // 不要删除后台数据，因为可能还在继续接收
      return;
    }

    // 切换到不同的线程，加载该线程的消息
    console.log('🔄 切换线程，加载消息:', threadId);
    loadThreadMessages(threadId);
  }, [threadId]);

  return {
    currentThreadIdRef,
    loadThreadMessages,
  };
}

