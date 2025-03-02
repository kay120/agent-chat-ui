import "./index.css";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { AIMessage, Message } from "@langchain/langgraph-sdk";
import { useState } from "react";

export default function StockPrice(props: {
  instruction: string;
  logo: string;
}) {
  const [counter, setCounter] = useState(0);

  // useStream should be able to be infered from context
  const thread = useStream<{ messages: Message[] }>({
    assistantId: "assistant_123",
    apiUrl: "http://localhost:3123",
  });

  const messagesCopy = thread.messages;

  const aiTool = messagesCopy
    .slice()
    .reverse()
    .find(
      (message): message is AIMessage =>
        message.type === "ai" && !!message.tool_calls?.length
    );

  const toolCallId = aiTool?.tool_calls?.[0]?.id;

  return (
    <div className="flex flex-col gap-2 border border-solid border-slate-500 p-4 rounded-md">
      Request: {props.instruction}
      <button className="text-left" onClick={() => setCounter(counter + 1)}>
        Click me
      </button>
      <p>Counter: {counter}</p>
      {toolCallId && (
        <button
          className="text-left"
          onClick={() => {
            thread.submit({
              messages: [
                {
                  type: "tool",
                  tool_call_id: toolCallId!,
                  name: "stockbroker",
                  content: "hey",
                },
                { type: "human", content: `Buy ${counter}` },
              ],
            });
          }}
        >
          Buy
        </button>
      )}
    </div>
  );
}
