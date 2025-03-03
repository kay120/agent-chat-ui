import { ReactNode, useEffect } from "react";
import {
  useExternalStoreRuntime,
  AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { HumanMessage, Message, ToolMessage } from "@langchain/langgraph-sdk";
import { useStreamContext } from "./Stream";
import { convertLangChainMessages } from "./convert-messages";

function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  const newMessages: ToolMessage[] = [];

  messages.forEach((message, index) => {
    if (message.type !== "ai" || message.tool_calls?.length === 0) {
      // If it's not an AI message, or it doesn't have tool calls, we can ignore.
      return;
    }
    // If it has tool calls, ensure the message which follows this is a tool message
    const followingMessage = messages[index + 1];
    if (followingMessage && followingMessage.type === "tool") {
      // Following message is a tool message, so we can ignore.
      return;
    }

    // Since the following message is not a tool message, we must create a new tool message
    newMessages.push(
      ...(message.tool_calls?.map((tc) => ({
        type: "tool" as const,
        tool_call_id: tc.id ?? "",
        id: tc.id ?? "",
        name: tc.name,
        content: "Successfully handled tool call.",
      })) ?? [])
    );
  });

  return newMessages;
}

export function RuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const stream = useStreamContext();

  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== "text")
      throw new Error("Only text messages are supported");

    const input = message.content[0].text;
    const humanMessage: HumanMessage = { type: "human", content: input };
    const newMessages = [
      ...ensureToolCallsHaveResponses(stream.messages),
      humanMessage,
    ];
    console.log("Sending new messages", newMessages);
    stream.submit({ messages: newMessages }, { streamMode: ["values"] });
  };

  useEffect(() => {
    console.log("useEffect - stream.messages", stream.messages);
  }, [stream.messages]);

  const runtime = useExternalStoreRuntime({
    isRunning: stream.isLoading,
    messages: stream.messages,
    convertMessage: convertLangChainMessages,
    onNew,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
