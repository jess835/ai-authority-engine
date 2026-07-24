import { getLLM } from "../lib/llm.js";
import { log } from "../lib/logger.js";
import { ASSETS, assetPrompt, render, systemPrompt, type AssetSpec } from "./registry.js";

export interface GenContext {
  client: string;
  title: string;
  brief: string;
  transcript: string;
}

export interface GeneratedAsset {
  spec: AssetSpec;
  body: string;
}

function userMessage(spec: AssetSpec, ctx: GenContext): string {
  return render(assetPrompt(spec), {
    CLIENT: ctx.client,
    TITLE: ctx.title,
    BRIEF: ctx.brief,
    TRANSCRIPT: ctx.transcript,
  });
}

/** Generate a single asset from the brief + transcript. */
export async function generateAsset(spec: AssetSpec, ctx: GenContext): Promise<string> {
  return getLLM().complete(systemPrompt(), userMessage(spec, ctx), { maxTokens: spec.maxTokens });
}

/** Generate all 18 assets. Returns each spec with its body; failures are skipped and logged. */
export async function generateAllAssets(ctx: GenContext): Promise<GeneratedAsset[]> {
  const out: GeneratedAsset[] = [];
  for (const spec of ASSETS) {
    try {
      log.info("Generating asset", { key: spec.key });
      const body = await generateAsset(spec, ctx);
      if (!body) throw new Error("empty output");
      out.push({ spec, body });
    } catch (err) {
      log.error("Asset generation failed", { key: spec.key, error: String(err) });
    }
  }
  return out;
}
