import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync, statSync, existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import ffmpegPath from "ffmpeg-static";
import { log } from "./logger.js";

const TMP = join(process.cwd(), "tmp");

// Whisper's hard API limit is 25 MB. Stay comfortably under it.
const MAX_BYTES = 24 * 1024 * 1024;
// Compressed target: mono, 16 kHz, low bitrate. Speech stays perfectly legible
// and a 90-minute episode lands around 20 MB, so most files need no chunking.
const CHUNK_SECONDS = 20 * 60; // fallback chunk length if a file is still too big

/** Download a remote audio URL to a local temp file. */
export async function downloadAudio(url: string, id: string): Promise<string> {
  mkdirSync(TMP, { recursive: true });
  const dest = join(TMP, `${id}.src`);
  log.info("Downloading audio", { url, dest });
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Audio download failed: HTTP ${res.status} for ${url}`);
  }
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
  const mb = (statSync(dest).size / 1024 / 1024).toFixed(1);
  log.info("Downloaded audio", { dest, sizeMB: mb });
  return dest;
}

function runFfmpeg(args: string[]): Promise<void> {
  if (!ffmpegPath) throw new Error("ffmpeg-static binary not found");
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath as string, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-500)}`))
    );
  });
}

/**
 * Turn any source audio file into one or more Whisper-ready mp3 chunks, each
 * under the size limit. Strategy: first compress the whole file to mono 16 kHz
 * ~48 kbps mp3. If that single file is already small enough, return it. Only if
 * it is still too large do we segment it into fixed-length chunks.
 */
export async function prepareForWhisper(srcPath: string, id: string): Promise<string[]> {
  mkdirSync(TMP, { recursive: true });
  const compressed = join(TMP, `${id}.mp3`);
  log.info("Compressing audio (mono 16kHz 48k)", { srcPath });
  await runFfmpeg([
    "-y", "-i", srcPath,
    "-ac", "1", "-ar", "16000", "-b:a", "48k",
    "-map", "a", compressed,
  ]);

  const size = statSync(compressed).size;
  log.info("Compressed audio", { compressed, sizeMB: (size / 1024 / 1024).toFixed(1) });
  if (size <= MAX_BYTES) return [compressed];

  // Still too big (very long episode). Segment into time-based chunks.
  log.info("Compressed file still over limit, segmenting", { chunkSeconds: CHUNK_SECONDS });
  const pattern = join(TMP, `${id}-chunk-%03d.mp3`);
  await runFfmpeg([
    "-y", "-i", compressed,
    "-f", "segment", "-segment_time", String(CHUNK_SECONDS),
    "-c", "copy", pattern,
  ]);
  const files = (await readdir(TMP))
    .filter((f) => f.startsWith(`${id}-chunk-`) && f.endsWith(".mp3"))
    .sort()
    .map((f) => join(TMP, f));
  log.info("Segmented audio", { chunks: files.length });
  return files;
}

export function fileExists(p: string): boolean {
  return existsSync(p);
}
