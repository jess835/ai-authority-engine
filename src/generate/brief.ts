import { getLLM } from "../lib/llm.js";
import { systemPrompt, briefPrompt, render } from "./registry.js";

/** Generate the master Content Brief from a transcript (one LLM call). */
export async function generateBrief(client: string, title: string, transcript: string): Promise<string> {
  const user = render(briefPrompt(), { CLIENT: client, TITLE: title, TRANSCRIPT: transcript });
  return getLLM().complete(systemPrompt(), user, { maxTokens: 2000 });
}
