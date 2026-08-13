/**
 * Where each asset type is destined to go. The destination is a label the publisher
 * uses to route the asset (the agency's own endpoint decides the exact platform action).
 * "internal" assets are working material for the strategist, not something to auto-post.
 */
export const DESTINATIONS: Record<string, string> = {
  "SEO titles": "website",
  "YouTube description": "youtube",
  Chapters: "youtube",
  Tags: "youtube",
  "Pinned comment": "youtube",
  "Clip ideas": "internal",
  "AI-search summary": "website",
  "LinkedIn article": "linkedin",
  "Medium article": "medium",
  "Social post - X": "social",
  "Social post - LinkedIn": "social",
  "Social post - Instagram": "social",
  "Social post - Facebook": "social",
  "Quote bank": "internal",
  FAQ: "website",
  "PDF guide outline": "internal",
  "Entity map": "internal",
  "Internal-linking map": "website",
};

export function destinationFor(assetType: string): string {
  return DESTINATIONS[assetType] ?? "website";
}

/** Destinations that produce a public web page worth submitting to Bing for indexing. */
export const BING_INDEXABLE = new Set(["website"]);
