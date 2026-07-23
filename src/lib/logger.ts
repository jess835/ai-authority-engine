import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LOG_DIR = join(process.cwd(), "logs");

/**
 * Structured run logger. Prints to the console and appends one JSON line per
 * event to logs/runs.jsonl so a missed trigger or a failed run is visible after
 * the fact, not silent (BUILD_PLAN section 10).
 */
function write(level: "info" | "warn" | "error", msg: string, data?: unknown) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(data !== undefined ? { data } : {}),
  };
  const line = `[${entry.ts}] ${level.toUpperCase()} ${msg}` +
    (data !== undefined ? ` ${safeJson(data)}` : "");
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(join(LOG_DIR, "runs.jsonl"), JSON.stringify(entry) + "\n");
  } catch {
    // never let logging failure break a run
  }
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export const log = {
  info: (msg: string, data?: unknown) => write("info", msg, data),
  warn: (msg: string, data?: unknown) => write("warn", msg, data),
  error: (msg: string, data?: unknown) => write("error", msg, data),
};
