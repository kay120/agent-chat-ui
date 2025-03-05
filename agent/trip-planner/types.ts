import { Annotation } from "@langchain/langgraph";
import { GenerativeUIAnnotation } from "../types";

export type TripDetails = {
  location: string;
  startDate: Date;
  endDate: Date;
  numberOfGuests: number;
};

export const TripPlannerAnnotation = Annotation.Root({
  messages: GenerativeUIAnnotation.spec.messages,
  ui: GenerativeUIAnnotation.spec.ui,
  timestamp: GenerativeUIAnnotation.spec.timestamp,
  tripDetails: Annotation<TripDetails | undefined>(),
});

export type TripPlannerState = typeof TripPlannerAnnotation.State;
export type TripPlannerUpdate = typeof TripPlannerAnnotation.Update;
