import { useState } from "react";
import { type Message } from "@langchain/langgraph-sdk";
import type { StreamState } from "./types";

/**
 * 流式处理状态管理 Hook
 */
export function useStreamState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentStreamThreadId, setCurrentStreamThreadId] = useState<string | null>(null);

  const state: StreamState = {
    messages,
    isLoading,
    currentRunId,
    abortController,
    currentStreamThreadId,
  };

  const actions = {
    setMessages,
    setIsLoading,
    setCurrentRunId,
    setAbortController,
    setCurrentStreamThreadId,
  };

  return {
    state,
    actions,
  };
}

