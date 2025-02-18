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
import type ComponentMap from "./ui";
import { z, ZodTypeAny } from "zod";

// const llm = new ChatOllama({ model: "deepseek-r1" });
const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

interface ToolCall {
  name: string;
  args: Record<string, any>;
  id?: string;
  type?: "tool_call";
}

function findToolCall<Name extends string>(name: Name) {
  return <Args extends ZodTypeAny>(
    x: ToolCall
  ): x is { name: Name; args: z.infer<Args> } => x.name === name;
}

const builder = new StateGraph(
  Annotation.Root({
    messages: MessagesAnnotation.spec["messages"],
    ui: Annotation({ default: () => [], reducer: uiMessageReducer }),
    timestamp: Annotation<number>,
  })
)
  .addNode("agent", async (state, config) => {
    const ui = typedUi<typeof ComponentMap>(config);

    // const result = ui.interrupt("react-component", {
    //   instruction: "Hello world",
    // });

    // // throw new Error("Random error");
    // // stream custom events
    // for (let count = 0; count < 10; count++) config.writer?.({ count });

    // How do I properly assign
    const stockbrokerSchema = z.object({ company: z.string() });
    const message = await llm
      .bindTools([
        {
          name: "stockbroker",
          description: "A tool to get the stock price of a company",
          schema: stockbrokerSchema,
        },
      ])
      .invoke([
        new SystemMessage(
          "You are a stockbroker agent that uses tools to get the stock price of a company"
        ),
        ...state.messages,
      ]);

    const stockbrokerToolCall = message.tool_calls?.find(
      findToolCall("stockbroker")<typeof stockbrokerSchema>
    );

    if (stockbrokerToolCall) {
      const instruction = `The stock price of ${
        stockbrokerToolCall.args.company
      } is ${Math.random() * 100}`;

      ui.write("react-component", { instruction, logo: "hey" });
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
