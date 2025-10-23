import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { Thread } from "@langchain/langgraph-sdk";
import { useQueryState } from "nuqs";
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { createClient } from "./client";

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
  deleteThread: (threadId: string) => Promise<boolean>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string,
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [apiUrl] = useQueryState("apiUrl");
  const [assistantId] = useQueryState("assistantId");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  // 使用默认值，与 Stream 提供者保持一致
  const DEFAULT_API_URL = "http://localhost:2024";
  const effectiveApiUrl = apiUrl || DEFAULT_API_URL;

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!effectiveApiUrl) return [];

    try {
      setThreadsLoading(true);

      // 官方 LangGraph API 使用 POST /threads/search
      const response = await fetch(`${effectiveApiUrl}/threads/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 100,  // 获取最近 100 个线程
          offset: 0,
        }),
      });

      if (!response.ok) {
        throw new Error('获取线程失败');
      }

      const threads = await response.json();
      // 官方 API 直接返回线程数组
      console.log('📋 getThreads 获取到线程:', threads.length, '个');
      setThreads(threads);
      console.log('✅ setThreads 已调用');
      return threads;
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    } finally {
      setThreadsLoading(false);
    }
  }, [effectiveApiUrl]);

  const deleteThread = useCallback(async (threadId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${effectiveApiUrl}/threads/${threadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除线程失败');
      }

      // 官方 API 删除成功后返回空响应或 204 状态码
      // 直接从本地状态中移除已删除的线程
      setThreads(prevThreads => prevThreads.filter(t => t.thread_id !== threadId));
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }, [effectiveApiUrl]);



  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    deleteThread,
  };

  return (
    <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads 必须在 ThreadProvider 内使用");
  }
  return context;
}
