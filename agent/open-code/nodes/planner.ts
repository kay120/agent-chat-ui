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
  _state: OpenCodeState,
  config: LangGraphRunnableConfig,
): Promise<OpenCodeUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const toolCallId = uuidv4();
  const aiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content: "I've come up with a detailed plan for building the todo app.",
    tool_calls: [
      {
        name: "plan",
        args: {
          args: {
            plan: PLAN,
          },
        },
        id: toolCallId,
        type: "tool_call",
      },
    ],
  };

  ui.write("code-plan", {
    toolCallId,
    plan: PLAN,
  });

  const toolMessage: ToolMessage = {
    type: "tool",
    id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
    tool_call_id: toolCallId,
    content: "User has approved the plan.",
  };

  return {
    messages: [aiMessage, toolMessage],
    ui: ui.collect as OpenCodeUpdate["ui"],
    timestamp: Date.now(),
  };
}
