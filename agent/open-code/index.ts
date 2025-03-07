import { END, START, StateGraph } from "@langchain/langgraph";
import { OpenCodeAnnotation } from "./types";
import { planner } from "./nodes/planner";
import { executor } from "./nodes/executor";

const workflow = new StateGraph(OpenCodeAnnotation)
  .addNode("planner", planner)
  .addNode("executor", executor)
  .addEdge(START, "planner")
  .addEdge("planner", "executor")
  .addEdge("executor", END);

export const graph = workflow.compile();
graph.name = "Open Code Graph";
