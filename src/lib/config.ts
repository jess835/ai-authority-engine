import "dotenv/config";

/** Read an env var, throwing a clear error if a required one is missing. */
export function env(key: string, required = true): string {
  const v = process.env[key]?.trim();
  if (required && !v) {
    throw new Error(
      `Missing required env var ${key}. Copy .env.example to .env and fill it in.`
    );
  }
  return v ?? "";
}

/** Optional env var, returns "" when unset. */
export function optionalEnv(key: string): string {
  return process.env[key]?.trim() ?? "";
}

export const config = {
  openaiKey: () => env("OPENAI_API_KEY"),
  assemblyKey: () => optionalEnv("ASSEMBLYAI_API_KEY"),
  notionKey: () => env("NOTION_API_KEY"),
  notionParentPageId: () => env("NOTION_PARENT_PAGE_ID"),
  sourcesDbId: () => env("SOURCES_DB_ID"),
  assetsDbId: () => optionalEnv("ASSETS_DB_ID"),
  pilotFeedUrl: () => env("PILOT_FEED_URL"),
  pilotClientName: () => optionalEnv("PILOT_CLIENT_NAME") || "Pilot Client",
};
