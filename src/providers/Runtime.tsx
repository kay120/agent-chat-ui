import { ReactNode } from "react";
import {
  useExternalStoreRuntime,
  AppendMessage,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { HumanMessage } from "@langchain/langgraph-sdk";
import { useStreamContext } from "./Stream";
import { convertLangChainMessages } from "./convert-messages";

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
    stream.submit({ messages: [humanMessage] });
  };

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
