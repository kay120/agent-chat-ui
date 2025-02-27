/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  StateGraph,
  MessagesAnnotation,
  START,
  Annotation,
} from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import { uiMessageReducer } from "@langchain/langgraph-sdk/react-ui/types";
import type ComponentMap from "./uis/index";
import { z, ZodTypeAny } from "zod";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

const getStockPriceSchema = z.object({
  ticker: z.string().describe("The ticker symbol of the company"),
});
const getPortfolioSchema = z.object({
  get_portfolio: z.boolean().describe("Should be true."),
});

const STOCKBROKER_TOOLS = [
  {
    name: "get_stock_price",
    description: "A tool to get the stock price of a company",
    schema: getStockPriceSchema,
  },
  {
    name: "get_portfolio",
    description:
      "A tool to get the user's portfolio details. Only call this tool if the user requests their portfolio details.",
    schema: getPortfolioSchema,
  },
];

interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
  type?: "tool_call";
}

function findToolCall<Name extends string>(name: Name) {
  return <Args extends ZodTypeAny>(
    x: ToolCall,
  ): x is { name: Name; args: z.infer<Args> } => x.name === name;
}

const builder = new StateGraph(
  Annotation.Root({
    messages: MessagesAnnotation.spec["messages"],
    ui: Annotation({ default: () => [], reducer: uiMessageReducer }),
    timestamp: Annotation<number>,
  }),
)
  .addNode("agent", async (state, config) => {
    const ui = typedUi<typeof ComponentMap>(config);

    const message = await llm
      .bindTools(STOCKBROKER_TOOLS)
      .invoke([
        new SystemMessage(
          "You are a stockbroker agent that uses tools to get the stock price of a company",
        ),
        ...state.messages,
      ]);

    const stockbrokerToolCall = message.tool_calls?.find(
      findToolCall("get_stock_price")<typeof getStockPriceSchema>,
    );
    const portfolioToolCall = message.tool_calls?.find(
      findToolCall("get_portfolio")<typeof getStockPriceSchema>,
    );

    if (stockbrokerToolCall) {
      const instruction = `The stock price of ${
        stockbrokerToolCall.args.ticker
      } is ${Math.random() * 100}`;

      ui.write("stock-price", { instruction, logo: "hey" });
    }

    if (portfolioToolCall) {
      ui.write("portfolio-view", {});
    }

    return { messages: message, ui: ui.collect, timestamp: Date.now() };
  })
  .addEdge(START, "agent");

export const graph = builder.compile();

// event handler of evetns ˇtypes)
// event handler for specific node -> handle node

// TODO:
// - Send run ID & additional metadata for the client to properly use messages (maybe we even have a config)
// - Store that run ID in messages
