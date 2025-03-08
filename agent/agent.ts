import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { GenerativeUIAnnotation, GenerativeUIState } from "./types";
import { stockbrokerGraph } from "./stockbroker";
import { ChatOpenAI } from "@langchain/openai";
import { tripPlannerGraph } from "./trip-planner";
import { formatMessages } from "./utils/format-messages";
import { graph as openCodeGraph } from "./open-code";
import { graph as orderPizzaGraph } from "./pizza-orderer";

const allToolDescriptions = `- stockbroker: can fetch the price of a ticker, purchase/sell a ticker, or get the user's portfolio
- tripPlanner: helps the user plan their trip. it can suggest restaurants, and places to stay in any given location.
- openCode: can write code for the user. call this tool when the user asks you to write code
- orderPizza: can order a pizza for the user`;

async function router(
  state: GenerativeUIState,
): Promise<Partial<GenerativeUIState>> {
  const routerDescription = `The route to take based on the user's input.
${allToolDescriptions}
- generalInput: handles all other cases where the above tools don't apply
`;
  const routerSchema = z.object({
    route: z
      .enum(["stockbroker", "tripPlanner", "openCode", "orderPizza", "generalInput"])
      .describe(routerDescription),
  });
  const routerTool = {
    name: "router",
    description: "A tool to route the user's query to the appropriate tool.",
    schema: routerSchema,
  };

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
  })
    .bindTools([routerTool], { tool_choice: "router" })
    .withConfig({ tags: ["langsmith:nostream"] });

  const prompt = `You're a highly helpful AI assistant, tasked with routing the user's query to the appropriate tool.
You should analyze the user's input, and choose the appropriate tool to use.`;

  const allMessagesButLast = state.messages.slice(0, -1);
  const lastMessage = state.messages.at(-1);

  const formattedPreviousMessages = formatMessages(allMessagesButLast);
  const formattedLastMessage = lastMessage ? formatMessages([lastMessage]) : "";

  const humanMessage = `Here is the full conversation, excluding the most recent message:
  
${formattedPreviousMessages}

Here is the most recent message:

${formattedLastMessage}

Please pick the proper route based on the most recent message, in the context of the entire conversation.`;

  const response = await llm.invoke([
    { role: "system", content: prompt },
    { role: "user", content: humanMessage },
  ]);

  const toolCall = response.tool_calls?.[0]?.args as
    | z.infer<typeof routerSchema>
    | undefined;
  if (!toolCall) {
    throw new Error("No tool call found in response");
  }

  return {
    next: toolCall.route,
  };
}

function handleRoute(
  state: GenerativeUIState,
): "stockbroker" | "tripPlanner" | "openCode" | "orderPizza" | "generalInput" {
  return state.next;
}

const GENERAL_INPUT_SYSTEM_PROMPT = `You are an AI assistant.
If the user asks what you can do, describe these tools.
${allToolDescriptions}

If the last message is a tool result, describe what the action was, congratulate the user, or send a friendly followup in response to the tool action. Ensure this is a clear and concise message.

Otherwise, just answer as normal.`;

async function handleGeneralInput(state: GenerativeUIState) {
  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const response = await llm.invoke([
    {
      role: "system",
      content: GENERAL_INPUT_SYSTEM_PROMPT,
    },
    ...state.messages,
  ]);

  return {
    messages: [response],
  };
}

const builder = new StateGraph(GenerativeUIAnnotation)
  .addNode("router", router)
  .addNode("stockbroker", stockbrokerGraph)
  .addNode("tripPlanner", tripPlannerGraph)
  .addNode("openCode", openCodeGraph)
  .addNode("orderPizza", orderPizzaGraph)
  .addNode("generalInput", handleGeneralInput)

  .addConditionalEdges("router", handleRoute, [
    "stockbroker",
    "tripPlanner",
    "openCode",
    "orderPizza",
    "generalInput",
  ])
  .addEdge(START, "router")
  .addEdge("stockbroker", END)
  .addEdge("tripPlanner", END)
  .addEdge("openCode", END)
  .addEdge("orderPizza", END)
  .addEdge("generalInput", END);

export const graph = builder.compile();
graph.name = "Generative UI Agent";
