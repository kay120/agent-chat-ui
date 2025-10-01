import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { flushSync } from "react-dom";
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
import { LangGraphLogoSVG } from "@/components/icons/langgraph";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { getApiKey } from "@/lib/api-key";
import { useThreads } from "./Thread";
import { toast } from "sonner";

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
  const { getThreads, setThreads } = useThreads();



  // 真正的增量流式处理
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [currentStreamThreadId, setCurrentStreamThreadId] = useState<string | null>(null);

  // 当 threadId 改变时处理消息加载
  useEffect(() => {
    console.log('🔍 useEffect 触发:', {
      threadId,
      isLoading,
      currentStreamThreadId,
      messagesLength: messages.length
    });

    if (threadId === null) {
      setMessages([]);
      console.log('🆕 新建对话，清空消息历史');
    } else {
      // 只有在没有正在进行的流式请求，或者流式请求不是当前线程时才加载消息
      // 但是如果当前已经有消息了，并且是同一个线程，就不要重新加载
      if (!isLoading || currentStreamThreadId !== threadId) {
        // 如果当前消息不为空，并且是同一个线程，跳过加载
        if (messages.length > 0 && currentStreamThreadId === threadId) {
          console.log('📝 当前线程已有消息，跳过重新加载');
          return;
        }
        console.log('🔄 切换到线程:', threadId, '当前流式线程:', currentStreamThreadId);
        loadThreadMessages(threadId);
      } else {
        console.log('⏳ 当前线程正在流式处理中，跳过消息加载');
      }
    }
  }, [threadId, isLoading, currentStreamThreadId]);

  const loadThreadMessages = async (selectedThreadId: string) => {
    try {
      console.log('📥 加载线程消息:', selectedThreadId);
      const response = await fetch(`${apiUrl}/threads`);
      if (!response.ok) {
        throw new Error('获取线程失败');
      }
      const threads = await response.json();
      const selectedThread = threads.find((t: any) => t.thread_id === selectedThreadId);

      if (selectedThread && selectedThread.values && selectedThread.values.messages) {
        const threadMessages = selectedThread.values.messages.map((msg: any) => ({
          id: msg.id,
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

  const stop = async () => {
    console.log('🛑 用户点击取消按钮');
    console.log('📊 当前状态:', {
      currentRunId,
      hasAbortController: !!abortController,
      isLoading,
      currentStreamThreadId
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
        // 取消时保存当前对话到历史记录
        if (currentStreamThreadId && messages.length > 0) {
          console.log('💾 取消时保存对话到历史记录，线程ID:', currentStreamThreadId);
          // 这里可以调用保存历史记录的API
          // 暂时通过控制台日志记录
        }

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

  const submit = async (input: { messages: Message[] }) => {
    setIsLoading(true);

    // 记录当前流式请求的线程ID
    const requestThreadId = threadId;
    setCurrentStreamThreadId(requestThreadId);
    console.log('🚀 开始流式请求，线程ID:', requestThreadId);

    // 设置用户消息
    setMessages(input.messages);

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

    try {
      const requestBody = {
        input: {
          messages: input.messages.map(msg => ({
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

                  // 立即更新界面
                  flushSync(() => {
                    setMessages(prevMessages => {
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
                    });
                  });
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
      // 无论当前显示的是哪个线程，都要保存流式处理的结果到对应线程的历史记录
      if (requestThreadId && aiContent.trim()) {
        console.log('💾 保存流式处理结果到线程:', requestThreadId);
        // 这里可以调用保存历史记录的API
        // 暂时通过控制台日志记录
      }

      setIsLoading(false);
      setCurrentRunId(null);
      setAbortController(null);
      setCurrentStreamThreadId(null);
      console.log('🏁 流式请求完成，清理状态');
    }
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

  // For API key, use localStorage with env var fallback
  const [apiKey, _setApiKey] = useState(() => {
    const storedKey = getApiKey();
    return storedKey || "";
  });

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    _setApiKey(key);
  };

  // Determine final values to use, prioritizing URL params then env vars
  const finalApiUrl = apiUrl || envApiUrl;
  const finalAssistantId = assistantId || envAssistantId;



  // Show the form if we: don't have an API URL, or don't have an assistant ID
  if (!finalApiUrl || !finalAssistantId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="animate-in fade-in-0 zoom-in-95 bg-background flex max-w-3xl flex-col rounded-lg border shadow-lg">
          <div className="mt-14 flex flex-col gap-2 border-b p-6">
            <div className="flex flex-col items-start gap-2">
              <LangGraphLogoSVG className="h-7" />
              <h1 className="text-xl font-semibold tracking-tight">
                Agent Chat
              </h1>
            </div>
            <p className="text-muted-foreground">
              Welcome to Agent Chat! Before you get started, you need to enter
              the URL of the deployment and the assistant / graph ID.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const apiUrl = formData.get("apiUrl") as string;
              const assistantId = formData.get("assistantId") as string;
              const apiKey = formData.get("apiKey") as string;

              setApiUrl(apiUrl);
              setApiKey(apiKey);
              setAssistantId(assistantId);

              form.reset();
            }}
            className="bg-muted/50 flex flex-col gap-6 p-6"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiUrl">
                部署URL<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                这是您的 LangGraph 部署的 URL。可以是本地或生产环境部署。
              </p>
              <Input
                id="apiUrl"
                name="apiUrl"
                className="bg-background"
                defaultValue={apiUrl || DEFAULT_API_URL}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="assistantId">
                助手 / 图形 ID<span className="text-rose-500">*</span>
              </Label>
              <p className="text-muted-foreground text-sm">
                这是图形的 ID（可以是图形名称），或用于获取线程和执行操作的助手 ID。
              </p>
              <Input
                id="assistantId"
                name="assistantId"
                className="bg-background"
                defaultValue={assistantId || DEFAULT_ASSISTANT_ID}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">LangSmith API 密钥</Label>
              <p className="text-muted-foreground text-sm">
                如果使用本地 LangGraph 服务器，这<strong>不是</strong>必需的。此值存储在浏览器的本地存储中，
                仅用于验证发送到 LangGraph 服务器的请求。
              </p>
              <PasswordInput
                id="apiKey"
                name="apiKey"
                defaultValue={apiKey ?? ""}
                className="bg-background"
                placeholder="lsv2_pt_..."
              />
            </div>

            <div className="mt-2 flex justify-end">
              <Button
                type="submit"
                size="lg"
              >
                继续
                <ArrowRight className="size-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <StreamSession
      apiKey={apiKey}
      apiUrl={apiUrl}
      assistantId={assistantId}
    >
      {children}
    </StreamSession>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext 必须在 StreamProvider 内使用");
  }
  return context;
};

export default StreamContext;
