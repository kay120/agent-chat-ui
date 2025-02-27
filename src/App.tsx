import "./App.css";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import type {
  UIMessage,
  RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui/types";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui/client";
import { Thread } from "@/components/assistant-ui/thread";

function App() {
  const thread = useStream<
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

   return (
    <div className="h-full">
      <Thread />
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {thread.messages.map((message, idx) => {
          const meta = thread.getMessagesMetadata(message, idx);
          const seenState = meta?.firstSeenState;
          const customComponent = seenState?.values.ui
            .slice()
            .reverse()
            .find(
              ({ additional_kwargs }) =>
                additional_kwargs.run_id === seenState.metadata?.run_id
            );

          return (
            <div key={message.id}>
              <pre>{JSON.stringify(message, null, 2)}</pre>
              {customComponent && (
                <LoadExternalComponent
                  assistantId="agent"
                  stream={thread}
                  message={customComponent}
                />
              )}
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();

          const formData = new FormData(e.target as HTMLFormElement);
          const message = formData.get("message");
          if (typeof message !== "string") return;
          thread.submit({
            messages: [{ type: "human", content: message }],
          });
        }}
      >
        <input
          type="text"
          name="message"
          defaultValue="What's the price of AAPL?"
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

export default App;
