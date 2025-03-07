import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { OpenCodeAnnotation, OpenCodeState } from "./types";
import { planner } from "./nodes/planner";
import {
  executor,
  SUCCESSFULLY_COMPLETED_STEPS_CONTENT,
} from "./nodes/executor";
import { AIMessage } from "@langchain/langgraph-sdk";

function conditionallyEnd(
  state: OpenCodeState,
  config: LangGraphRunnableConfig,
): typeof END | "planner" {
  const fullWriteAccess = !!config.configurable?.permissions?.full_write_access;
  const lastAiMessage = state.messages.findLast(
    (m) => m.getType() === "ai",
  ) as unknown as AIMessage;

  // If the user did not grant full write access, or the last AI message is the success message, end
  // otherwise, loop back to the start.
  if (
    (typeof lastAiMessage.content === "string" &&
      lastAiMessage.content === SUCCESSFULLY_COMPLETED_STEPS_CONTENT) ||
    !fullWriteAccess
  ) {
    return END;
  }

  return "planner";
}

const workflow = new StateGraph(OpenCodeAnnotation)
  .addNode("planner", planner)
  .addNode("executor", executor)
  .addEdge(START, "planner")
  .addEdge("planner", "executor")
  .addConditionalEdges("executor", conditionallyEnd, ["planner", END]);

export const graph = workflow.compile();
graph.name = "Open Code Graph";
