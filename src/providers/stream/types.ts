import { type Message } from "@langchain/langgraph-sdk";

/**
 * 流式处理状态
 */
export interface StreamState {
  messages: Message[];
  isLoading: boolean;
  currentRunId: string | null;
  abortController: AbortController | null;
  currentStreamThreadId: string | null;
}

/**
 * 流式处理操作
 */
export interface StreamActions {
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentRunId: (runId: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  setCurrentStreamThreadId: (threadId: string | null) => void;
  submit: (input: { messages: Message[] }) => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * 后台线程数据
 */
export interface BackgroundThread {
  threadId: string;
  messages: Message[];
  lastUpdated: number;
}

/**
 * 流式处理配置
 */
export interface StreamConfig {
  apiUrl: string;
  apiKey: string | null;
  threadId: string | null;
  onThreadsRefresh: () => Promise<void>;
}

