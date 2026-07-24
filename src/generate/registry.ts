import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROMPTS_DIR = join(process.cwd(), "prompts");

export type Review = "auto" | "human";

/** One derivative asset: its Notion type name, its prompt file, and review policy. */
export interface AssetSpec {
  key: string;
  notionType: string; // must match a name in notion.ts ASSET_TYPES
  file: string; // filename in prompts/assets/
  review: Review;
  maxTokens?: number;
}

/**
 * The 18 assets (BUILD_PLAN section 7). Review policy is conservative on purpose:
 * only truly mechanical, internal-use assets auto-approve. Anything that gets
 * published in the client's voice waits for a human (the whole point of the gate).
 * Edit these freely, and edit the prompt text in prompts/assets/ without touching code.
 */
export const ASSETS: AssetSpec[] = [
  { key: "seo-titles", notionType: "SEO titles", file: "seo-titles.md", review: "human" },
  { key: "youtube-description", notionType: "YouTube description", file: "youtube-description.md", review: "human" },
  { key: "chapters", notionType: "Chapters", file: "chapters.md", review: "human" },
  { key: "tags", notionType: "Tags", file: "tags.md", review: "auto" },
  { key: "pinned-comment", notionType: "Pinned comment", file: "pinned-comment.md", review: "human" },
  { key: "clip-ideas", notionType: "Clip ideas", file: "clip-ideas.md", review: "human" },
  { key: "ai-search-summary", notionType: "AI-search summary", file: "ai-search-summary.md", review: "human" },
  { key: "linkedin-article", notionType: "LinkedIn article", file: "linkedin-article.md", review: "human", maxTokens: 2500 },
  { key: "medium-article", notionType: "Medium article", file: "medium-article.md", review: "human", maxTokens: 3000 },
  { key: "social-x", notionType: "Social post - X", file: "social-x.md", review: "human" },
  { key: "social-linkedin", notionType: "Social post - LinkedIn", file: "social-linkedin.md", review: "human" },
  { key: "social-instagram", notionType: "Social post - Instagram", file: "social-instagram.md", review: "human" },
  { key: "social-facebook", notionType: "Social post - Facebook", file: "social-facebook.md", review: "human" },
  { key: "quote-bank", notionType: "Quote bank", file: "quote-bank.md", review: "human" },
  { key: "faq", notionType: "FAQ", file: "faq.md", review: "human" },
  { key: "pdf-guide-outline", notionType: "PDF guide outline", file: "pdf-guide-outline.md", review: "human" },
  { key: "entity-map", notionType: "Entity map", file: "entity-map.md", review: "auto" },
  { key: "internal-linking-map", notionType: "Internal-linking map", file: "internal-linking-map.md", review: "auto" },
];

let _system: string | null = null;
export function systemPrompt(): string {
  if (_system === null) _system = readFileSync(join(PROMPTS_DIR, "system.md"), "utf8");
  return _system;
}

export function briefPrompt(): string {
  return readFileSync(join(PROMPTS_DIR, "brief.md"), "utf8");
}

export function assetPrompt(spec: AssetSpec): string {
  return readFileSync(join(PROMPTS_DIR, "assets", spec.file), "utf8");
}

/** Fill {{CLIENT}}, {{TITLE}}, {{BRIEF}}, {{TRANSCRIPT}} placeholders. */
export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? `[missing:${k}]`);
}
