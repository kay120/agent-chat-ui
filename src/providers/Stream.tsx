import React, { createContext, useContext, ReactNode } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import type {
  UIMessage,
  RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui/types";

// Define the type for the context value
type StreamContextType = ReturnType<
  typeof useStream<
    { messages: Message[]; ui: UIMessage[] },
    {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    },
    UIMessage | RemoveUIMessage
  >
>;

// Create the context with a default undefined value
const StreamContext = createContext<StreamContextType | undefined>(undefined);

// Create a provider component
export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const streamValue = useStream<
    { messages: Message[]; ui: UIMessage[] },
    {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    },
    UIMessage | RemoveUIMessage
  >({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
  });

  console.log("StreamProvider", streamValue);

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
