import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types";

export const StockbrokerAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  ui: GenerativeUIAnnotation.spec.ui,
  timestamp: GenerativeUIAnnotation.spec.timestamp,
  next: Annotation<"stockbroker" | "weather">(),
});

export type StockbrokerState = typeof StockbrokerAnnotation.State;
