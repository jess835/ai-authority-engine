import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";
import { fetchFeed, isProcessed } from "./rss.js";

/**
 * Detection-only run: poll the feed and report what is new. No API keys needed.
 * This is the "detect" half of Week 1 ingestion, provable on its own.
 */
async function main() {
  const feedUrl = process.argv[2] || config.pilotFeedUrl();
  log.info("Detecting new content", { feedUrl });
  const episodes = await fetchFeed(feedUrl);
  log.info("Feed fetched", { total: episodes.length });

  console.log(`\nFeed: ${feedUrl}`);
  console.log(`Total items: ${episodes.length}\n`);
  console.log("Latest 5:");
  for (const ep of episodes.slice(0, 5)) {
    const isNew = !isProcessed(feedUrl, ep.id);
    console.log(
      `  ${isNew ? "NEW " : "seen"}  ${ep.publishedDate?.slice(0, 10) ?? "????-??-??"}  ${ep.title}`
    );
    console.log(`        audio: ${ep.audioUrl ? "yes" : "no"}`);
  }
  const newest = episodes[0];
  console.log(
    `\nNewest unprocessed: ${
      newest && !isProcessed(feedUrl, newest.id) ? newest.title : "(none — all seen)"
    }\n`
  );
}

main().catch((err) => {
  log.error("Detection failed", { error: String(err) });
  process.exit(1);
});
