import { v4 as uuidv4 } from "uuid";
import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { OpenCodeState, OpenCodeUpdate } from "../types";
import { DO_NOT_RENDER_ID_PREFIX } from "@/lib/ensure-tool-responses";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import ComponentMap from "../../uis";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";

export const PLAN = [
  "Set up project scaffolding using Create React App and implement basic folder structure for components, styles, and utilities.",
  "Create reusable UI components for TodoItem, including styling with CSS modules.",
  "Implement state management using React Context to handle todo items, including actions for adding, updating, and deleting todos.",
  "Add form functionality for creating new todos with input validation and error handling.",
  "Create filtering and sorting capabilities to allow users to view completed, active, or all todos.",
  "Implement local storage integration to persist todo items between page refreshes.",
];

export async function planner(
  state: OpenCodeState,
  config: LangGraphRunnableConfig,
): Promise<OpenCodeUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const lastPlanToolCall = state.messages.findLast(
    (m) =>
      m.getType() === "ai" &&
      (m as unknown as AIMessage).tool_calls?.some((tc) => tc.name === "plan"),
  ) as AIMessage | undefined;
  const planToolCallArgs = lastPlanToolCall?.tool_calls?.[0]?.args?.args;
  const executedPlans = planToolCallArgs?.executedPlans ?? [];
  const remainingPlans = planToolCallArgs?.remainingPlans ?? PLAN;

  const content =
    executedPlans.length > 0
      ? `I've updated the plan list based on the executed plans.`
      : `I've come up with a detailed plan for building the todo app.`;

  const toolCallId = uuidv4();
  const aiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content,
    tool_calls: [
      {
        name: "plan",
        args: {
          args: {
            executedPlans,
            remainingPlans,
          },
        },
        id: toolCallId,
        type: "tool_call",
      },
    ],
  };

  const msg = ui.create("code-plan", {
    toolCallId,
    executedPlans,
    remainingPlans,
  });
  msg.additional_kwargs["message_id"] = aiMessage.id;

  const toolMessage: ToolMessage = {
    type: "tool",
    id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
    tool_call_id: toolCallId,
    content: "User has approved the plan.",
  };

  return {
    messages: [aiMessage, toolMessage],
    ui: [msg],
    timestamp: Date.now(),
  };
}
