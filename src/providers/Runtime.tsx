import { useState, ReactNode } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { Message } from "@langchain/langgraph-sdk";

function langChainRoleToAssistantRole(role: Message["type"]): "system" | "assistant" | "user" {
  if (role === "ai") return "assistant";
  if (role === "system") return "system";
  if (["human", "tool", "function"].includes(role)) return "user";
  throw new Error(`Unknown role: ${role}`);
}

function langChainContentToAssistantContent(content: Message["content"]): ThreadMessageLike["content"] {
  if (!content) return [];
  
  if (typeof content === "string") return content;

  if (typeof content === "object") {
    if ("text" in content) {
      return [{
        type: "text",
        text: content.text as string,
      }]
    }

    if ("thinking" in content) {
      return [{
        type: "reasoning",
        text: content.thinking as string,
      }]
    }
  }

  throw new Error(`Unknown content: ${content}`);
}
 
const convertMessage = (message: Message): ThreadMessageLike => {
  return {
    role: langChainRoleToAssistantRole(message.type),
    content: langChainContentToAssistantContent(message.content),
  };
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function RuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
 
  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== "text")
      throw new Error("Only text messages are supported");
 
    const input = message.content[0].text;
    setMessages((currentConversation) => [
      ...currentConversation,
      { type: "human", content: input },
    ]);
 
    setIsRunning(true);
    // CALL API HERE
    // const assistantMessage = await backendApi(input);
    await sleep(2000);
    setMessages((currentConversation) => [
      ...currentConversation,
      { type: "ai", content: [{ type: "text", text: "This is an assistant message" }] },
    ]);
    setIsRunning(false);
  };
 
  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    convertMessage,
    onNew,
  });
 
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}