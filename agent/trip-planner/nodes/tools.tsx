import { TripPlannerState, TripPlannerUpdate } from "../types";
import { ChatOpenAI } from "@langchain/openai";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../uis/index";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getAccommodationsListProps } from "../utils/get-accommodations";

const schema = z.object({
  listAccommodations: z
    .boolean()
    .optional()
    .describe(
      "Whether or not the user has requested a list of accommodations for their trip.",
    ),
  bookAccommodation: z
    .boolean()
    .optional()
    .describe(
      "Whether or not the user has requested to book a reservation for an accommodation. If true, you MUST also set the 'accommodationName' field",
    ),
  accommodationName: z
    .string()
    .optional()
    .describe(
      "The name of the accommodation to book a reservation for. Only required if the 'bookAccommodation' field is true.",
    ),

  listRestaurants: z
    .boolean()
    .optional()
    .describe(
      "Whether or not the user has requested a list of restaurants for their trip.",
    ),
  bookRestaurant: z
    .boolean()
    .optional()
    .describe(
      "Whether or not the user has requested to book a reservation for a restaurant. If true, you MUST also set the 'restaurantName' field",
    ),
  restaurantName: z
    .string()
    .optional()
    .describe(
      "The name of the restaurant to book a reservation for. Only required if the 'bookRestaurant' field is true.",
    ),
});

export async function callTools(
  state: TripPlannerState,
  config: LangGraphRunnableConfig,
): Promise<TripPlannerUpdate> {
  if (!state.tripDetails) {
    throw new Error("No trip details found");
  }

  const ui = typedUi<typeof ComponentMap>(config);

  const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 }).bindTools(
    [
      {
        name: "trip-planner",
        description: "A series of actions to take for planning a trip",
        schema,
      },
    ],
    {
      tool_choice: "trip-planner",
    },
  );

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are an AI assistant who helps users book trips. Use the user's most recent message(s) to contextually generate a response.",
    },
    ...state.messages,
  ]);

  const tripPlan = response.tool_calls?.[0]?.args as
    | z.infer<typeof schema>
    | undefined;
  const toolCallId = response.tool_calls?.[0]?.id;
  if (!tripPlan || !toolCallId) {
    throw new Error("No trip plan found");
  }

  if (tripPlan.listAccommodations) {
    ui.write("accommodations-list", {
      toolCallId,
      ...getAccommodationsListProps(state.tripDetails),
    });
  }
  if (tripPlan.bookAccommodation && tripPlan.accommodationName) {
    ui.write("book-accommodation", {
      tripDetails: state.tripDetails,
      accommodationName: tripPlan.accommodationName,
    });
  }

  if (tripPlan.listRestaurants) {
    ui.write("restaurants-list", { tripDetails: state.tripDetails });
  }

  if (tripPlan.bookRestaurant && tripPlan.restaurantName) {
    ui.write("book-restaurant", {
      tripDetails: state.tripDetails,
      restaurantName: tripPlan.restaurantName,
    });
  }

  return {
    messages: [response],
    ui: ui.collect as TripPlannerUpdate["ui"],
    timestamp: Date.now(),
  };
}
