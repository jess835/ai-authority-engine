import { createReadStream } from "node:fs";
import OpenAI from "openai";
import { config } from "./config.js";
import { log } from "./logger.js";
import { downloadAudio, prepareForWhisper } from "./audio.js";

export interface TranscriptResult {
  text: string;
  provider: string;
}

/**
 * A transcript provider takes a public audio URL and returns transcript text.
 * Providers are tried in order until one succeeds (BUILD_PLAN section 3 fallback
 * chain). Each is isolated behind this one interface so any can be swapped.
 */
export interface TranscriptProvider {
  name: string;
  available(): boolean;
  transcribe(audioUrl: string, id: string): Promise<string>;
}

/** Primary: yt-dlp/enclosure audio -> compress -> OpenAI Whisper. Cheapest. */
class WhisperProvider implements TranscriptProvider {
  name = "whisper";
  available() {
    return !!config.openaiKey();
  }
  async transcribe(audioUrl: string, id: string): Promise<string> {
    const client = new OpenAI({ apiKey: config.openaiKey() });
    const src = await downloadAudio(audioUrl, id);
    const chunks = await prepareForWhisper(src, id);
    const parts: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      log.info("Whisper transcribing chunk", { index: i + 1, of: chunks.length });
      const res = await client.audio.transcriptions.create({
        file: createReadStream(chunks[i]) as any,
        model: "whisper-1",
        response_format: "text",
      });
      parts.push(typeof res === "string" ? res : (res as any).text ?? "");
    }
    return parts.join("\n").trim();
  }
}

/** Fallback: AssemblyAI. Takes the URL directly, no size limit, handles long audio. */
class AssemblyAIProvider implements TranscriptProvider {
  name = "assemblyai";
  available() {
    return !!config.assemblyKey();
  }
  async transcribe(audioUrl: string, _id: string): Promise<string> {
    const key = config.assemblyKey();
    const headers = { authorization: key, "content-type": "application/json" };
    const submit = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers,
      body: JSON.stringify({ audio_url: audioUrl }),
    });
    if (!submit.ok) throw new Error(`AssemblyAI submit failed: HTTP ${submit.status}`);
    const { id } = (await submit.json()) as { id: string };

    // Poll until done.
    for (let attempt = 0; attempt < 120; attempt++) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, { headers });
      const data = (await poll.json()) as { status: string; text?: string; error?: string };
      if (data.status === "completed") return (data.text ?? "").trim();
      if (data.status === "error") throw new Error(`AssemblyAI error: ${data.error}`);
      log.info("AssemblyAI polling", { status: data.status });
    }
    throw new Error("AssemblyAI timed out");
  }
}

const PROVIDERS: TranscriptProvider[] = [new WhisperProvider(), new AssemblyAIProvider()];

/**
 * Get a transcript for a public audio URL, trying each available provider in
 * order and failing over on error. Throws only if every provider fails.
 */
export async function getTranscript(audioUrl: string, id: string): Promise<TranscriptResult> {
  const available = PROVIDERS.filter((p) => p.available());
  if (available.length === 0) {
    throw new Error("No transcript provider configured. Set OPENAI_API_KEY (and/or ASSEMBLYAI_API_KEY).");
  }
  let lastErr: unknown;
  for (const provider of available) {
    try {
      log.info("Transcribing", { provider: provider.name, audioUrl });
      const text = await provider.transcribe(audioUrl, id);
      if (!text) throw new Error("empty transcript");
      log.info("Transcript captured", { provider: provider.name, chars: text.length });
      return { text, provider: provider.name };
    } catch (err) {
      lastErr = err;
      log.warn("Provider failed, falling over", { provider: provider.name, error: String(err) });
    }
  }
  throw new Error(`All transcript providers failed. Last error: ${String(lastErr)}`);
}
