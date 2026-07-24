import OpenAI from "openai";
import { config, optionalEnv } from "./config.js";
import { log } from "./logger.js";

/**
 * One interface for text generation so the provider can be swapped (OpenAI now,
 * Claude later for long-context Brief work, per BUILD_PLAN section 2) without
 * touching any generation code.
 */
export interface LLMProvider {
  name: string;
  complete(system: string, user: string, opts?: { maxTokens?: number }): Promise<string>;
}

class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client = new OpenAI({ apiKey: config.openaiKey() });
  private model = optionalEnv("OPENAI_MODEL") || "gpt-4o-mini";

  async complete(system: string, user: string, opts?: { maxTokens?: number }): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      max_tokens: opts?.maxTokens ?? 2000,
    });
    return res.choices[0]?.message?.content?.trim() ?? "";
  }
}

let _provider: LLMProvider | null = null;

/** Get the configured LLM provider (defaults to OpenAI). */
export function getLLM(): LLMProvider {
  if (_provider) return _provider;
  const which = (optionalEnv("LLM_PROVIDER") || "openai").toLowerCase();
  switch (which) {
    case "openai":
      _provider = new OpenAIProvider();
      break;
    default:
      throw new Error(`Unknown LLM_PROVIDER "${which}". Supported: openai.`);
  }
  log.info("LLM provider", { provider: _provider.name });
  return _provider;
}
