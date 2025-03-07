import { OpenCodeState, OpenCodeUpdate } from "../types";

export async function interrupt(state: OpenCodeState): Promise<OpenCodeUpdate> {
  throw new Error("Not implemented" + state);
}