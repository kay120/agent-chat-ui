import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types";

export const OpenCodeAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  ui: GenerativeUIAnnotation.spec.ui,
  timestamp: GenerativeUIAnnotation.spec.timestamp,
});

export type OpenCodeState = typeof OpenCodeAnnotation.State;
export type OpenCodeUpdate = typeof OpenCodeAnnotation.Update;