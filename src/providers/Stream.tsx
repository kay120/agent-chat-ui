import React, { createContext, useContext, ReactNode } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import type {
  UIMessage,
  RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui/types";
import { useQueryParam, StringParam } from "use-query-params";

const useTypedStream = useStream<
  { messages: Message[]; ui: UIMessage[] },
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomUpdateType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [threadId, setThreadId] = useQueryParam("threadId", StringParam);

  const streamValue = useTypedStream({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
    threadId: threadId ?? null,
    onThreadId: setThreadId,
  });

  console.log("threadId", threadId);
  console.log("streamValue", streamValue.values);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
