import { END, START, StateGraph } from "@langchain/langgraph";
import { OpenCodeAnnotation, OpenCodeState } from "./types";
import { planner } from "./nodes/planner";
import { interrupt } from "./nodes/interrupt";
import { executor } from "./nodes/executor";

function handleRoutingFromExecutor(state: OpenCodeState): "executor" | "interrupt" {
  const lastAIMessage = state.messages.findLast((m) => m.getType() === "ai");
  if (lastAIMessage)
}

function handleRoutingFromInterrupt(state: OpenCodeState): "executor" | typeof END {}

const workflow = new StateGraph(OpenCodeAnnotation)
  .addNode("planner", planner)
  .addNode("executor", executor)
  .addNode("interrupt", interrupt)
  .addEdge(START, "planner")
  .addEdge("planner", "executor")
  .addConditionalEdges("executor", handleRoutingFromExecutor, ["executor", "interrupt"])
  .addConditionalEdges("interrupt", handleRoutingFromInterrupt, ["executor", END])