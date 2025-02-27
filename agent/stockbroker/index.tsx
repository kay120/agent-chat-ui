/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateGraph, START } from "@langchain/langgraph";
import { StockbrokerAnnotation } from "./types";
import { callTools } from "./nodes/tools";

const builder = new StateGraph(StockbrokerAnnotation)
  .addNode("agent", callTools)
  .addEdge(START, "agent");

export const stockbrokerGraph = builder.compile();
stockbrokerGraph.name = "Stockbroker";
