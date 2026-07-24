import { readFileSync } from "node:fs";
import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";
import {
  appendBriefToSource,
  createAsset,
  listSourcesByStatus,
  readTranscript,
  setSourceStatus,
} from "../lib/notion.js";
import { ASSETS, assetPrompt, briefPrompt, render, systemPrompt } from "./registry.js";
import { generateBrief } from "./brief.js";
import { generateAllAssets } from "./assets.js";

/**
 * Week 2 deliverable: a stored transcript -> Brief + all 18 assets, each written
 * into the Notion Assets DB with an approval status, ready for review.
 *
 * Usage:
 *   npm run generate                    # every Source with Status = transcribed
 *   npm run generate -- --source <id>   # one specific Source page
 *   npm run generate -- --dry-run --file tests/sample-transcript.md
 *                                       # offline: prove the wiring, no keys, no writes
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return {
    source: get("--source"),
    file: get("--file"),
    dryRun: args.includes("--dry-run"),
  };
}

/** Offline check: render the brief prompt and every asset prompt, report sizes + policy. */
function dryRun(file: string) {
  const transcript = readFileSync(file, "utf8");
  const client = config.pilotClientName();
  const title = "SAMPLE EPISODE";
  const brief = "[the generated brief would appear here]";

  const briefMsg = render(briefPrompt(), { CLIENT: client, TITLE: title, TRANSCRIPT: transcript });
  console.log("\n=== DRY RUN (no API calls, no Notion writes) ===");
  console.log(`transcript chars : ${transcript.length}`);
  console.log(`system prompt     : ${systemPrompt().length} chars`);
  console.log(`brief user message: ${briefMsg.length} chars`);
  console.log(`\n18 assets to generate (type -> review policy):`);
  for (const spec of ASSETS) {
    const msg = render(assetPrompt(spec), { CLIENT: client, TITLE: title, BRIEF: brief, TRANSCRIPT: transcript });
    const approval = spec.review === "auto" ? "approved" : "pending";
    console.log(`  ${spec.notionType.padEnd(24)} ${spec.review.padEnd(6)} -> ${approval}  (prompt ${msg.length} chars)`);
  }
  console.log(`\nTotal assets: ${ASSETS.length}. Auto-approve: ${ASSETS.filter((a) => a.review === "auto").length}, human review: ${ASSETS.filter((a) => a.review === "human").length}.`);
  console.log("Wiring OK. Add OPENAI_API_KEY + Notion keys and drop --dry-run to run for real.\n");
}

async function processSource(id: string, title: string) {
  log.info("Generating for source", { id, title });
  const transcript = await readTranscript(id);
  if (!transcript) {
    log.warn("No transcript found on source page, skipping", { id, title });
    return;
  }
  const client = config.pilotClientName();

  const brief = await generateBrief(client, title, transcript);
  await appendBriefToSource(id, brief);
  log.info("Brief generated", { id, chars: brief.length });

  const assets = await generateAllAssets({ client, title, brief, transcript });
  for (const { spec, body } of assets) {
    await createAsset({
      sourceId: id,
      assetType: spec.notionType,
      name: `${title} — ${spec.notionType}`,
      body,
      approvalStatus: spec.review === "auto" ? "approved" : "pending",
    });
  }
  await setSourceStatus(id, "generated");
  log.info("Source generation complete", { id, assets: assets.length });
}

async function main() {
  const { source, file, dryRun: dry } = parseArgs();

  if (dry) {
    dryRun(file || "tests/sample-transcript.md");
    return;
  }

  if (source) {
    await processSource(source, "Episode");
    return;
  }

  const pending = await listSourcesByStatus("transcribed");
  if (pending.length === 0) {
    log.info("No transcribed sources awaiting generation");
    return;
  }
  log.info("Generating for transcribed sources", { count: pending.length });
  for (const s of pending) {
    await processSource(s.id, s.title);
  }
}

main().catch((err) => {
  log.error("Generation run crashed", { error: String(err) });
  process.exit(1);
});
