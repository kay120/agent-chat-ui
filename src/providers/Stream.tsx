import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
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

  // 用一个 ref 来跟踪上一个 threadId
  const prevThreadIdRef = useRef<string | null>(threadId);

  // 用一个 ref 来实时跟踪当前的 threadId（不受 useEffect 延迟影响）
  const currentThreadIdRef = useRef<string | null>(threadId);

  // 后台运行的线程映射：threadId -> messages
  const backgroundThreadsRef = useRef<Map<string, Message[]>>(new Map());

  // 同步更新 currentThreadIdRef
  useEffect(() => {
    currentThreadIdRef.current = threadId;
  }, [threadId]);

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
      console.log('💾 保存当前线程到后台:', prevThreadId, '消息数:', messages.length);
      backgroundThreadsRef.current.set(prevThreadId, [...messages]);
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
    const backgroundMessages = backgroundThreadsRef.current.get(threadId);
    if (backgroundMessages) {
      console.log('📥 从后台恢复线程消息:', threadId, '消息数:', backgroundMessages.length);
      setMessages(backgroundMessages);
      // 不要删除后台数据，因为可能还在继续接收
      return;
    }

    // 切换到不同的线程，加载该线程的消息
    console.log('🔄 切换线程，加载消息:', threadId);
    loadThreadMessages(threadId);
  }, [threadId]);

  const loadThreadMessages = async (selectedThreadId: string) => {
    try {
      console.log('📥 加载线程消息:', selectedThreadId);

      // 官方 API: 获取单个线程的状态
      const response = await fetch(`${apiUrl}/threads/${selectedThreadId}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // 404 表示线程还没有状态（新创建的线程），这是正常的
        if (response.status === 404) {
          console.log('ℹ️ 线程还没有消息历史（新线程）');
          setMessages([]);
          return;
        }
        throw new Error(`获取线程状态失败: ${response.status}`);
      }

      const threadState = await response.json();
      console.log('📋 获取到线程状态:', threadState);

      // 官方 API 返回格式: {values: {messages: [...]}, ...}
      if (threadState.values && threadState.values.messages) {
        const threadMessages = threadState.values.messages.map((msg: any) => ({
          id: msg.id || `msg-${Date.now()}`,
          type: msg.type,
          content: msg.content,
        }));
        setMessages(threadMessages);
        console.log('✅ 成功加载线程消息:', threadMessages.length, '条');
      } else {
        console.log('⚠️ 线程消息为空');
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ 加载线程消息失败:', error);
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
        if (!currentRunId.startsWith('temp-') && currentStreamThreadId) {
          // 官方 API 使用 /threads/{thread_id}/runs/{run_id}/cancel
          const cancelUrl = `${apiUrl}/threads/${currentStreamThreadId}/runs/${currentRunId}/cancel`;
          console.log('📡 调用后端取消端点:', cancelUrl);
          try {
            const response = await fetch(cancelUrl, {
              method: 'POST',
            });
            const result = await response.json();
            console.log('🛑 后端取消响应:', result);
          } catch (backendError) {
            console.warn('⚠️ 后端取消请求失败，但前端已中止:', backendError);
          }
        } else {
          console.log('⏭️ 使用临时 Run ID 或缺少 Thread ID，跳过后端取消请求');
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

    // 如果没有 threadId，先创建一个新线程
    let requestThreadId = threadId;
    if (!requestThreadId) {
      console.log('🆕 没有 threadId，创建新线程...');
      try {
        const response = await fetch(`${apiUrl}/threads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`创建线程失败: ${response.status}`);
        }

        const newThread = await response.json();
        requestThreadId = newThread.thread_id;

        // 立即设置 threadId（同步更新 URL）
        await setThreadId(requestThreadId);
        console.log('✅ 创建新线程成功:', requestThreadId);

        // 异步刷新历史记录列表（不阻塞流式处理）
        console.log('🔄 创建新线程后异步刷新历史记录...');
        getThreads()
          .then(() => console.log('✅ 新线程已添加到历史记录'))
          .catch(error => console.error('❌ 刷新历史记录失败:', error));
      } catch (error) {
        console.error('❌ 创建线程失败:', error);
        setIsLoading(false);
        return;
      }
    }

    // 确保 requestThreadId 不是 null
    if (!requestThreadId) {
      console.error('❌ requestThreadId 为 null，无法继续');
      setIsLoading(false);
      return;
    }

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

    // 🆕 立即刷新历史记录列表（在开始流式输出时）
    console.log('🔄 开始流式输出，立即刷新历史记录...');
    try {
      await getThreads();  // getThreads() 内部已经调用了 setThreads()
      console.log('✅ 历史记录已刷新（开始时）');
    } catch (error) {
      console.error('❌ 刷新历史记录失败（开始时）:', error);
    }

    try {
      // 官方 LangGraph API 格式
      const requestBody = {
        assistant_id: "agent",  // 使用配置的助手 ID
        input: {
          messages: input.messages.map(msg => ({
            role: msg.type === 'human' ? 'user' : 'assistant',  // 官方 API 使用 role
            content: msg.content
          }))
        },
        stream_mode: ["messages", "values"]  // 使用 messages 模式获取流式输出
      };

      // 官方 API 使用 /threads/{thread_id}/runs/stream
      const streamUrl = `${apiUrl}/threads/${requestThreadId}/runs/stream`;
      console.log('📡 发送流式请求到:', streamUrl);

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      // 官方 API 通过 SSE 的 metadata 事件发送 run_id
      // 使用请求开始时的threadId，不受后续threadId变化影响
      console.log('🔒 流式处理锁定到线程:', requestThreadId);

      if (!response.body) {
        throw new Error('没有响应体');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let currentEvent = '';  // 用于存储当前事件类型
      let buffer = '';  // 累积未完成的行

      console.log('🎬 开始读取流式数据...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ 流式数据读取完成');
          break;
        }

        const chunk = decoder.decode(value);
        console.log('📦 收到原始chunk:', chunk.substring(0, 200));
        buffer += chunk;

        // 按行分割，保留最后一个可能不完整的行
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';  // 保存最后一个可能不完整的行

        for (const line of lines) {
          if (!line.trim()) continue;  // 跳过空行

          console.log('📝 处理行:', line.substring(0, 100));

          // 官方 API 使用 SSE 格式: event: xxx 和 data: xxx 分开
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            console.log('🏷️ 事件类型:', currentEvent);
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6).trim();
              if (!dataStr) continue;  // 跳过空数据

              const data = JSON.parse(dataStr);
              console.log('📦 收到流式数据 [event:', currentEvent, ']:', data);

              // 官方 API 的 messages/partial 事件包含流式消息块
              if (currentEvent === 'messages/partial' && data.length > 0) {
                const messageChunk = data[0];  // messages/partial 事件返回数组
                console.log('📨 messages/partial 数据:', messageChunk);

                if (messageChunk && messageChunk.type === 'ai' && messageChunk.content) {
                  // 这是流式的 AI 消息块（官方 API 直接给完整内容，不是增量）
                  aiContent = messageChunk.content;
                  console.log('🤖 收到AI流式块，总长度:', aiContent.length, '内容:', aiContent.substring(0, 50));

                  // 立即更新界面（流式效果）
                  const updateMessages = (prevMessages: Message[]) => {
                    const newMessages = [...prevMessages];
                    let aiMessageIndex = newMessages.findIndex(
                      msg => msg.id === aiMessageId && msg.type === 'ai'
                    );

                    if (aiMessageIndex === -1) {
                      newMessages.push({
                        id: aiMessageId,
                        type: 'ai',
                        content: aiContent
                      });
                    } else {
                      newMessages[aiMessageIndex] = {
                        ...newMessages[aiMessageIndex],
                        content: aiContent
                      };
                    }
                    return newMessages;
                  };

                  // 更新后台线程数据
                  const currentBackgroundMessages = backgroundThreadsRef.current.get(requestThreadId) || input.messages;
                  const updatedMessages = updateMessages(currentBackgroundMessages);
                  backgroundThreadsRef.current.set(requestThreadId, updatedMessages);

                  // 只有当前显示的是这个线程时，才更新界面
                  const currentDisplayThreadId = currentThreadIdRef.current;
                  console.log('🔍 检查是否更新界面 - 当前线程:', currentDisplayThreadId, '请求线程:', requestThreadId);
                  if (currentDisplayThreadId === requestThreadId) {
                    console.log('✅ 更新界面，消息数:', updatedMessages.length);
                    flushSync(() => {
                      setMessages(updatedMessages);
                    });
                  } else {
                    console.log('⏭️ 跳过界面更新（线程不匹配）');
                  }
                }
              }

              // 官方 API 的 values 事件包含完整的消息列表
              if (currentEvent === 'values' && data.messages) {
                const messages = data.messages;
                const lastMessage = messages[messages.length - 1];

                if (lastMessage && lastMessage.type === 'ai' && lastMessage.content) {
                  // 这是AI的回复内容（完整版本）
                  const fullContent = lastMessage.content;
                  console.log('🤖 收到AI回复（完整内容）:', fullContent.substring(0, 50) + '...');

                  // 直接使用完整内容
                  aiContent = fullContent;
                  console.log('📝 更新AI内容，总长度:', aiContent.length);

                  // 立即更新界面或后台线程
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
                  const currentBackgroundMessages = backgroundThreadsRef.current.get(requestThreadId) || input.messages;
                  const updatedMessages = updateMessages(currentBackgroundMessages);
                  backgroundThreadsRef.current.set(requestThreadId, updatedMessages);

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

              // 官方 API 的 metadata 事件包含 run_id
              if (currentEvent === 'metadata' && data.run_id) {
                setCurrentRunId(data.run_id);
                console.log('📍 从 metadata 获取到 Run ID:', data.run_id);
              }

              // 处理结束事件
              if (currentEvent === 'end') {
                console.log('✅ 流式输出结束');
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
      // 异步刷新历史记录列表（不阻塞）
      console.log('🔄 异步刷新历史记录列表...');
      getThreads()
        .then(() => console.log('✅ 历史记录已刷新'))
        .catch(error => console.error('❌ 刷新历史记录失败:', error));

      // 清理后台线程数据（流式请求已完成）
      if (requestThreadId) {
        backgroundThreadsRef.current.delete(requestThreadId);
        console.log('🧹 清理后台线程数据:', requestThreadId);
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
