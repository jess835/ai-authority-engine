import { statSync } from "node:fs";
import { downloadAudio, prepareForWhisper } from "../src/lib/audio.js";
import { log } from "../src/lib/logger.js";

/**
 * Diagnostic: download an audio URL and run the Whisper prep step, reporting
 * before/after sizes. Proves the compress/chunk path without needing an API key.
 *   npm run probe -- <audio-url>
 */
async function main() {
  const url = process.argv[2];
  if (!url) throw new Error("Usage: tsx scripts/probe-audio.ts <audio-url>");
  const src = await downloadAudio(url, "probe");
  const before = statSync(src).size;
  const chunks = await prepareForWhisper(src, "probe");
  const totalAfter = chunks.reduce((s, c) => s + statSync(c).size, 0);
  console.log("\n--- audio prep result ---");
  console.log("source size   :", (before / 1024 / 1024).toFixed(1), "MB");
  console.log("chunks         :", chunks.length);
  console.log("total after    :", (totalAfter / 1024 / 1024).toFixed(1), "MB");
  console.log("each under 24MB:", chunks.every((c) => statSync(c).size <= 24 * 1024 * 1024));
}

main().catch((err) => {
  log.error("probe failed", { error: String(err) });
  process.exit(1);
});
