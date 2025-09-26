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
  createThread: () => Promise<string | null>;
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
      const response = await fetch(`${effectiveApiUrl}/threads`);
      if (!response.ok) {
        throw new Error('获取线程失败');
      }
      const threads = await response.json();
      setThreads(threads);
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
      const result = await response.json();
      if (result.status === 'deleted') {
        // 从本地状态中移除已删除的线程
        setThreads(prevThreads => prevThreads.filter(t => t.thread_id !== threadId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }, [effectiveApiUrl]);

  const createThread = useCallback(async (): Promise<string | null> => {
    try {
      console.log('🆕 创建新线程...');
      const response = await fetch(`${effectiveApiUrl}/threads`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('创建线程失败');
      }
      const result = await response.json();
      console.log('✅ 新线程创建成功:', result.thread_id);
      return result.thread_id;
    } catch (error) {
      console.error('创建新线程失败:', error);
      return null;
    }
  }, [effectiveApiUrl]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
    deleteThread,
    createThread,
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
