import { useRef } from "react";
import { type Message } from "@langchain/langgraph-sdk";

/**
 * 后台线程管理 Hook
 * 用于管理在后台继续运行的流式请求
 */
export function useBackgroundThreads() {
  // 后台运行的线程映射：threadId -> messages
  const backgroundThreadsRef = useRef<Map<string, Message[]>>(new Map());

  /**
   * 保存线程消息到后台
   */
  const saveToBackground = (threadId: string, messages: Message[]) => {
    backgroundThreadsRef.current.set(threadId, [...messages]);
    console.log('💾 保存线程到后台:', threadId, '消息数:', messages.length);
  };

  /**
   * 从后台获取线程消息
   */
  const getFromBackground = (threadId: string): Message[] | undefined => {
    const messages = backgroundThreadsRef.current.get(threadId);
    if (messages) {
      console.log('📥 从后台恢复线程消息:', threadId, '消息数:', messages.length);
    }
    return messages;
  };

  /**
   * 更新后台线程消息
   */
  const updateBackground = (threadId: string, messages: Message[]) => {
    backgroundThreadsRef.current.set(threadId, messages);
    console.log('🔄 更新后台线程:', threadId, '消息数:', messages.length);
  };

  /**
   * 删除后台线程数据
   */
  const removeFromBackground = (threadId: string) => {
    backgroundThreadsRef.current.delete(threadId);
    console.log('🧹 清理后台线程数据:', threadId);
  };

  /**
   * 检查线程是否在后台运行
   */
  const hasBackground = (threadId: string): boolean => {
    return backgroundThreadsRef.current.has(threadId);
  };

  return {
    saveToBackground,
    getFromBackground,
    updateBackground,
    removeFromBackground,
    hasBackground,
  };
}

