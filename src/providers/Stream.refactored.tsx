import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  isUIMessage,
  isRemoveUIMessage,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { getApiKey } from "@/lib/api-key";
import { useThreads } from "./Thread";
import { toast } from "sonner";

// 导入模块化的 Hooks 和服务
import {
  useStreamState,
  useBackgroundThreads,
  useThreadLoader,
  StreamService,
} from "./stream";

export type StateType = { messages: Message[]; ui?: UIMessage[] };

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  const { getThreads } = useThreads();

  // 使用模块化的状态管理
  const { state, actions } = useStreamState();
  const {
    messages,
    isLoading,
    currentRunId,
    abortController,
  } = state;

  const {
    setMessages,
    setIsLoading,
    setCurrentRunId,
    setAbortController,
    setCurrentStreamThreadId,
  } = actions;

  // 使用后台线程管理
  const backgroundThreads = useBackgroundThreads();

  // 使用线程加载逻辑
  const { currentThreadIdRef } = useThreadLoader({
    threadId,
    isLoading,
    messages,
    apiUrl,
    setMessages,
    saveToBackground: backgroundThreads.saveToBackground,
    getFromBackground: backgroundThreads.getFromBackground,
  });

  /**
   * 停止流式请求
   */
  const stop = async () => {
    console.log('🛑 用户点击取消按钮');
    console.log('📊 当前状态:', {
      currentRunId,
      hasAbortController: !!abortController,
      isLoading,
    });

    if (currentRunId && abortController) {
      try {
        console.log('🚫 中止前端请求...');
        // 立即取消当前请求
        abortController.abort();

        // 只有当 run_id 不是临时的时候才调用后端取消端点
        if (!currentRunId.startsWith('temp-')) {
          console.log('📡 调用后端取消端点:', `${apiUrl}/runs/${currentRunId}/cancel`);
          try {
            const response = await fetch(`${apiUrl}/runs/${currentRunId}/cancel`, {
              method: 'POST',
            });
            const result = await response.json();
            console.log('🛑 后端取消响应:', result);
          } catch (backendError) {
            console.warn('⚠️ 后端取消请求失败，但前端已中止:', backendError);
          }
        } else {
          console.log('⏭️ 使用临时 Run ID，跳过后端取消请求');
        }

        console.log('🛑 取消请求成功:', currentRunId);
      } catch (error) {
        console.error('取消请求失败:', error);
      } finally {
        setIsLoading(false);
        setCurrentRunId(null);
        setAbortController(null);
        setCurrentStreamThreadId(null);
      }
    } else {
      console.warn('⚠️ 无法取消: 缺少 currentRunId 或 abortController', {
        currentRunId,
        hasAbortController: !!abortController
      });
    }
  };

  /**
   * 提交消息并开始流式处理
   */
  const submit = async (input: { messages: Message[] }) => {
    const streamService = new StreamService({
      apiUrl,
      requestThreadId: threadId,
      inputMessages: input.messages,
      currentThreadIdRef,
      setMessages,
      setIsLoading,
      setCurrentRunId,
      setAbortController,
      setCurrentStreamThreadId,
      setThreadId,
      updateBackground: backgroundThreads.updateBackground,
      removeFromBackground: backgroundThreads.removeFromBackground,
      onThreadsRefresh: getThreads,
    });

    await streamService.execute();
  };

  const streamValue = {
    messages,
    isLoading,
    submit,
    stop,
    values: { messages },
    ui: [],
    // 添加缺失的方法
    getMessagesMetadata: () => ({}),
    meta: {},
    thread: null,
    setMessages,  // 添加 setMessages 方法供外部调用
  };

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey).then((ok) => {
      if (!ok) {
        toast.error("无法连接到 LangGraph 服务器", {
          description: () => (
            <p>
              请确保您的图形正在 <code>{apiUrl}</code> 运行，并且
              您的 API 密钥设置正确（如果连接到已部署的图形）。
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl]);

  console.log('🎉 简单流式处理状态:', {
    messages: messages.length,
    isLoading,
  });

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

// Default values for the form
const DEFAULT_API_URL = "http://localhost:2024";
const DEFAULT_ASSISTANT_ID = "agent";

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env.NEXT_PUBLIC_API_URL;
  const envAssistantId: string | undefined =
    process.env.NEXT_PUBLIC_ASSISTANT_ID;

  // Use URL params with env var fallbacks
  const [apiUrl, setApiUrl] = useQueryState("apiUrl", {
    defaultValue: envApiUrl || "",
  });
  const [assistantId, setAssistantId] = useQueryState("assistantId", {
    defaultValue: envAssistantId || "",
  });

  const [apiKey, setApiKey] = useQueryState("apiKey", {
    defaultValue: getApiKey() || "",
  });

  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (!apiUrl || !assistantId) {
      setShowForm(true);
    }
  }, [apiUrl, assistantId]);

  if (showForm) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <form
          className="flex w-full max-w-md flex-col gap-4 rounded-lg border p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newApiUrl = formData.get("apiUrl") as string;
            const newAssistantId = formData.get("assistantId") as string;
            const newApiKey = formData.get("apiKey") as string;

            setApiUrl(newApiUrl || DEFAULT_API_URL);
            setAssistantId(newAssistantId || DEFAULT_ASSISTANT_ID);
            setApiKey(newApiKey || "");
            setShowForm(false);
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              name="apiUrl"
              type="text"
              placeholder={DEFAULT_API_URL}
              defaultValue={apiUrl || DEFAULT_API_URL}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="assistantId">助手 ID</Label>
            <Input
              id="assistantId"
              name="assistantId"
              type="text"
              placeholder={DEFAULT_ASSISTANT_ID}
              defaultValue={assistantId || DEFAULT_ASSISTANT_ID}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="apiKey">API 密钥（可选）</Label>
            <PasswordInput
              id="apiKey"
              name="apiKey"
              placeholder="sk-..."
              defaultValue={apiKey || ""}
            />
          </div>
          <Button type="submit" className="w-full">
            连接 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <StreamSession
      apiKey={apiKey}
      apiUrl={apiUrl || DEFAULT_API_URL}
      assistantId={assistantId || DEFAULT_ASSISTANT_ID}
    >
      {children}
    </StreamSession>
  );
};

export function useStreamContext() {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
}

