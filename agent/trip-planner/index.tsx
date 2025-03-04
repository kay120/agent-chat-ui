import { StateGraph, START, END } from "@langchain/langgraph";
import { TripPlannerAnnotation, TripPlannerState } from "./types";
import { extraction } from "./nodes/extraction";
import { callTools } from "./nodes/tools";
import { classify } from "./nodes/classify";

function routeStart(state: TripPlannerState): "classify" | "extraction" {
  if (!state.tripDetails) {
    return "extraction";
  }

  return "classify";
}

function routeAfterClassifying(
  state: TripPlannerState,
): "callTools" | "extraction" {
  // if `tripDetails` is undefined, this means they are not relevant to the conversation
  if (!state.tripDetails) {
    return "extraction";
  }

  // otherwise, they are relevant, and we should route to callTools
  return "callTools";
}

function routeAfterExtraction(
  state: TripPlannerState,
): "callTools" | typeof END {
  // if `tripDetails` is undefined, this means they're missing some fields.
  if (!state.tripDetails) {
    return END;
  }

  return "callTools";
}

const builder = new StateGraph(TripPlannerAnnotation)
  .addNode("classify", classify)
  .addNode("extraction", extraction)
  .addNode("callTools", callTools)
  .addConditionalEdges(START, routeStart, ["classify", "extraction"])
  .addConditionalEdges("classify", routeAfterClassifying, [
    "callTools",
    "extraction",
  ])
  .addConditionalEdges("extraction", routeAfterExtraction, ["callTools", END])
  .addEdge("callTools", END);

export const tripPlannerGraph = builder.compile();
tripPlannerGraph.name = "Trip Planner";
