import { StockbrokerState } from "../types";
import { ToolMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import type ComponentMap from "../../uis/index";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { findToolCall } from "../../find-tool-call";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

const getStockPriceSchema = z.object({
  ticker: z.string().describe("The ticker symbol of the company"),
});
const getPortfolioSchema = z.object({
  get_portfolio: z.boolean().describe("Should be true."),
});

const STOCKBROKER_TOOLS = [
  {
    name: "stock-price",
    description: "A tool to get the stock price of a company",
    schema: getStockPriceSchema,
  },
  {
    name: "portfolio",
    description:
      "A tool to get the user's portfolio details. Only call this tool if the user requests their portfolio details.",
    schema: getPortfolioSchema,
  },
];

export async function callTools(
  state: StockbrokerState,
  config: LangGraphRunnableConfig,
): Promise<Partial<StockbrokerState>> {
  const ui = typedUi<typeof ComponentMap>(config);

  const message = await llm.bindTools(STOCKBROKER_TOOLS).invoke([
    {
      role: "system",
      content:
        "You are a stockbroker agent that uses tools to get the stock price of a company",
    },
    ...state.messages,
  ]);

  const stockbrokerToolCall = message.tool_calls?.find(
    findToolCall("stock-price")<typeof getStockPriceSchema>,
  );
  const portfolioToolCall = message.tool_calls?.find(
    findToolCall("portfolio")<typeof getStockPriceSchema>,
  );

  if (stockbrokerToolCall) {
    const instruction = `The stock price of ${
      stockbrokerToolCall.args.ticker
    } is ${Math.random() * 100}`;

    ui.write("stock-price", { instruction, logo: "hey" });
  }

  if (portfolioToolCall) {
    ui.write("portfolio", {});
  }

  const toolMessages =
    message.tool_calls?.map((tc) => {
      return new ToolMessage({
        name: tc.name,
        tool_call_id: tc.id ?? "",
        content: "Successfully handled tool call",
      });
    }) || [];

  console.log("Returning", [message, ...toolMessages]);

  return {
    messages: [message, ...toolMessages],
    // TODO: Fix the ui return type.
    ui: ui.collect as any[],
    timestamp: Date.now(),
  };
}
