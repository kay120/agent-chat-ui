import { v4 as uuidv4 } from "uuid";
import { AIMessage } from "@langchain/langgraph-sdk";
import { OpenCodeState, OpenCodeUpdate } from "../types";

export async function planner(state: OpenCodeState): Promise<OpenCodeUpdate> {
  const aiMessage: AIMessage = {
    type: "ai",
    id: uuidv4(),
    content: "",
    tool_calls: [
      {
        name: "update_file",
        args: {
          args: {
            new_file_content: "ADD_CODE_HERE"
          },
        },
        id: uuidv4(),
        type: "tool_call",
      }
    ]
  }

  const toolMessage = {}
}