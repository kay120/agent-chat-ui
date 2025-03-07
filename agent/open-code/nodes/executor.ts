import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { AIMessage } from "@langchain/langgraph-sdk";
import { OpenCodeState, OpenCodeUpdate } from "../types";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import ComponentMap from "../../uis";
import { typedUi } from "@langchain/langgraph-sdk/react-ui/server";
import { PLAN } from "./planner";

export async function executor(
  state: OpenCodeState,
  config: LangGraphRunnableConfig,
): Promise<OpenCodeUpdate> {
  const ui = typedUi<typeof ComponentMap>(config);

  const numOfUpdateFileCalls = state.messages.filter(
    (m) =>
      m.getType() === "ai" &&
      (m as unknown as AIMessage).tool_calls?.some(
        (tc) => tc.name === "update_file",
      ),
  ).length;
  const planItem = PLAN[numOfUpdateFileCalls - 1];

  let updateFileContents = "";
  switch (numOfUpdateFileCalls) {
    case 0:
      updateFileContents = await fs.readFile(
        "agent/open-code/nodes/plan-code/step-1.txt",
        "utf-8",
      );
      break;
    case 1:
      updateFileContents = await fs.readFile(
        "agent/open-code/nodes/plan-code/step-2.txt",
        "utf-8",
      );
      break;
    case 2:
      updateFileContents = await fs.readFile(
        "agent/open-code/nodes/plan-code/step-3.txt",
        "utf-8",
      );
      break;
    case 3:
      updateFileContents = await fs.readFile(
        "agent/open-code/nodes/plan-code/step-4.txt",
        "utf-8",
      );
      break;
    case 4:
      updateFileContents = await fs.readFile(
        "agent/open-code/nodes/plan-code/step-5.txt",
        "utf-8",
      );
      break;
    case 5:
      updateFileContents = await fs.readFile(
        "agent/open-code/nodes/plan-code/step-6.txt",
        "utf-8",
      );
      break;
    default:
      updateFileContents = "";
  }

  if (!updateFileContents) {
    throw new Error("No file updates found!");
  }

  const toolCallId = uuidv4();
  const aiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content: "",
    tool_calls: [
      {
        name: "update_file",
        args: {
          args: {
            new_file_content: updateFileContents,
          },
        },
        id: toolCallId,
        type: "tool_call",
      },
    ],
  };

  ui.write("proposed-change", {
    toolCallId,
    change: updateFileContents,
    planItem,
  });

  return {
    messages: [aiMessage],
    ui: ui.collect as OpenCodeUpdate["ui"],
    timestamp: Date.now(),
  };
}
