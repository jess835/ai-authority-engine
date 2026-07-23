import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import Parser from "rss-parser";
import type { SourceType } from "../lib/notion.js";

export interface Episode {
  id: string; // stable guid
  title: string;
  link: string; // human-facing episode URL
  audioUrl: string | null; // enclosure (what we send to transcription)
  publishedDate: string | null; // ISO
  sourceType: SourceType;
}

const parser = new Parser();

/** Fetch and normalize a podcast/blog RSS feed into episodes, newest first. */
export async function fetchFeed(feedUrl: string): Promise<Episode[]> {
  const feed = await parser.parseURL(feedUrl);
  return (feed.items ?? []).map((it) => {
    const audioUrl = it.enclosure?.url ?? null;
    return {
      id: it.guid || it.link || it.enclosure?.url || (it.title ?? "unknown"),
      title: it.title ?? "(untitled)",
      link: it.link ?? feedUrl,
      audioUrl,
      publishedDate: it.isoDate ?? (it.pubDate ? new Date(it.pubDate).toISOString() : null),
      // If there is an audio enclosure it is a podcast; otherwise treat as a blog item.
      sourceType: audioUrl ? "podcast" : "blog",
    };
  });
}

// --- Local dedupe state (lightweight; Notion is the real source of truth in ingest) ---

const STATE_DIR = join(process.cwd(), "data");
const STATE_FILE = join(STATE_DIR, "state.json");

type State = Record<string, { processed: string[] }>;

function readState(): State {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state: State) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function isProcessed(feedUrl: string, episodeId: string): boolean {
  return readState()[feedUrl]?.processed.includes(episodeId) ?? false;
}

export function markProcessed(feedUrl: string, episodeId: string) {
  const state = readState();
  state[feedUrl] ??= { processed: [] };
  if (!state[feedUrl].processed.includes(episodeId)) {
    state[feedUrl].processed.push(episodeId);
  }
  writeState(state);
}
