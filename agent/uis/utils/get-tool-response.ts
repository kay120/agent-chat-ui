import {
  useStreamContext,
  type UIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { Message, ToolMessage } from "@langchain/langgraph-sdk";

type StreamContextType = ReturnType<
  typeof useStreamContext<
    { messages: Message[]; ui: UIMessage[] },
    { MetaType: { ui: UIMessage | undefined } }
  >
>;

export function getToolResponse(
  toolCallId: string,
  thread: StreamContextType,
): ToolMessage | undefined {
  const toolResponse = thread.messages.findLast(
    (message): message is ToolMessage =>
      message.type === "tool" && message.tool_call_id === toolCallId,
  );
  return toolResponse;
}
