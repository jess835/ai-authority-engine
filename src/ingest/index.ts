import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";
import { getTranscript } from "../lib/transcription.js";
import { createSource, findSourceByUrl } from "../lib/notion.js";
import { fetchFeed, isProcessed, markProcessed, type Episode } from "./rss.js";

/**
 * Week 1 deliverable: new content drops -> detect it -> transcribe it ->
 * file it in Notion. Hands-off, idempotent (skips anything already in Notion).
 *
 * Usage:
 *   npm run ingest                 # newest unprocessed episode from PILOT_FEED_URL
 *   npm run ingest -- --latest 3   # newest 3 unprocessed episodes
 *   npm run ingest -- --feed <url> # a different feed
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    feed: get("--feed") || config.pilotFeedUrl(),
    latest: Number(get("--latest") || "1"),
  };
}

function slug(ep: Episode): string {
  return (ep.id || ep.title).replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "episode";
}

async function ingestEpisode(feedUrl: string, ep: Episode): Promise<"done" | "skipped" | "failed"> {
  if (!ep.audioUrl) {
    log.warn("Episode has no audio enclosure, skipping (blog path not built yet)", { title: ep.title });
    return "skipped";
  }
  // Idempotency: Notion is the source of truth.
  const existing = await findSourceByUrl(ep.link);
  if (existing) {
    log.info("Already in Notion, skipping", { title: ep.title, pageId: existing });
    markProcessed(feedUrl, ep.id);
    return "skipped";
  }

  try {
    const { text, provider } = await getTranscript(ep.audioUrl, slug(ep));
    const pageId = await createSource({
      title: ep.title,
      sourceType: ep.sourceType,
      sourceUrl: ep.link,
      publishedDate: ep.publishedDate ?? undefined,
      audioUrl: ep.audioUrl,
      status: "transcribed",
      transcript: text,
      transcriptProvider: provider,
    });
    markProcessed(feedUrl, ep.id);
    log.info("Ingested episode", { title: ep.title, pageId, provider, chars: text.length });
    return "done";
  } catch (err) {
    log.error("Ingest failed for episode", { title: ep.title, error: String(err) });
    return "failed";
  }
}

async function main() {
  const { feed, latest } = parseArgs();
  log.info("Ingest run starting", { feed, latest, client: config.pilotClientName() });

  const episodes = await fetchFeed(feed);
  const candidates = episodes
    .filter((ep) => !isProcessed(feed, ep.id))
    .slice(0, Math.max(1, latest));

  if (candidates.length === 0) {
    log.info("Nothing new to ingest", { feed });
    return;
  }

  const summary = { done: 0, skipped: 0, failed: 0 };
  for (const ep of candidates) {
    const result = await ingestEpisode(feed, ep);
    summary[result]++;
  }
  log.info("Ingest run complete", summary);
}

main().catch((err) => {
  log.error("Ingest run crashed", { error: String(err) });
  process.exit(1);
});
