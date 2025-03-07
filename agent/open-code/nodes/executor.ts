import { OpenCodeState, OpenCodeUpdate } from "../types";

export async function executor(state: OpenCodeState): Promise<OpenCodeUpdate> {
  throw new Error("Not implemented" + state);
}