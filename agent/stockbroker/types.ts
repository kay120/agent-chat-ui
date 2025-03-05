import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types";

export const StockbrokerAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  ui: GenerativeUIAnnotation.spec.ui,
  timestamp: GenerativeUIAnnotation.spec.timestamp,
});

export type StockbrokerState = typeof StockbrokerAnnotation.State;
export type StockbrokerUpdate = typeof StockbrokerAnnotation.Update;
