import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";
import { listAssets, readAssetBody, type AssetRow } from "../lib/notion.js";

/**
 * The "paste pack": the simplest possible distribution with zero external tools
 * (no Make, Zapier, n8n, or webhook). It reads every APPROVED asset and writes a
 * single self-contained HTML page grouping them by platform, in the order you post
 * them, each with a one-click copy button. You open it and paste your way down.
 *
 * Usage:
 *   npm run handoff              # build from live Notion data (approved assets)
 *   npm run handoff -- --sample  # preview with mock data, no keys
 */

// Which human platform each asset type belongs to, and the order to work through them.
const PLATFORMS: { name: string; note: string; types: string[] }[] = [
  { name: "Website / blog", note: "Do this first. This is what AI engines cite.", types: ["SEO titles", "AI-search summary", "FAQ", "Internal-linking map"] },
  { name: "YouTube", note: "Paste into the video in YouTube Studio.", types: ["YouTube description", "Chapters", "Tags", "Pinned comment"] },
  { name: "LinkedIn", note: "Article editor, then the post.", types: ["LinkedIn article", "Social post - LinkedIn"] },
  { name: "Medium", note: "New story. Set canonical link to the client's site.", types: ["Medium article"] },
  { name: "X", note: "Posts and thread.", types: ["Social post - X"] },
  { name: "Instagram", note: "Caption plus carousel to design.", types: ["Social post - Instagram"] },
  { name: "Facebook", note: "Posts.", types: ["Social post - Facebook"] },
  { name: "Working material (not posted as-is)", note: "Feeds other work.", types: ["Clip ideas", "Quote bank", "PDF guide outline", "Entity map"] },
];

interface Item {
  type: string;
  body: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!));
}

function render(client: string, generatedAt: string, items: Item[]): string {
  const byType = new Map(items.map((i) => [i.type, i]));
  const sections = PLATFORMS.map((p) => {
    const cards = p.types
      .filter((t) => byType.has(t))
      .map((t) => {
        const body = byType.get(t)!.body;
        return `<div class="card"><div class="chead"><span class="ct">${esc(t)}</span><button class="copy" data-copy>Copy</button></div><pre>${esc(body)}</pre></div>`;
      })
      .join("");
    if (!cards) return "";
    return `<section><h2>${esc(p.name)}</h2><p class="note">${esc(p.note)}</p>${cards}</section>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(client)} — Ready to Post</title><style>
:root{--bg:#faf9f7;--card:#fff;--border:#e5e5e2;--text:#191918;--muted:#74736e;--accent:#2563eb;--pre:#f6f6f4}
@media(prefers-color-scheme:dark){:root{--bg:#191817;--card:#232320;--border:#38382f;--text:#ededea;--muted:#a3a29b;--accent:#7ea6ff;--pre:#1b1b18}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:28px}
.wrap{max-width:820px;margin:0 auto}h1{font-size:22px;margin:0 0 2px}.sub{color:var(--muted);font-size:13px;margin-bottom:24px}
section{margin-bottom:28px}h2{font-size:16px;margin:0 0 2px}.note{color:var(--muted);font-size:12px;margin:0 0 12px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:12px}
.chead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.ct{font-weight:600;font-size:14px}
.copy{font:600 12px inherit;color:var(--accent);background:transparent;border:1px solid var(--border);border-radius:8px;padding:4px 12px;cursor:pointer}
.copy.done{color:#15803d}
pre{white-space:pre-wrap;word-wrap:break-word;background:var(--pre);border-radius:8px;padding:12px;margin:0;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
</style></head><body><div class="wrap">
<h1>${esc(client)} — Ready to Post</h1><div class="sub">Approved assets, in posting order · generated ${esc(generatedAt)}. Copy each into its platform.</div>
${sections || '<div class="card">Nothing approved yet. Approve assets in Notion, then run this again.</div>'}
</div>
<script>document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){var t=b.closest(".card").querySelector("pre").innerText;navigator.clipboard.writeText(t).then(function(){b.textContent="Copied";b.classList.add("done");setTimeout(function(){b.textContent="Copy";b.classList.remove("done")},1500)})})})</script>
</body></html>`;
}

function sampleItems(): Item[] {
  return [
    { type: "AI-search summary", body: "Cory Long argues that most expert content is invisible to AI search because it lives only as audio. To be cited by ChatGPT, Claude and Perplexity, ideas must exist as text across multiple properties..." },
    { type: "FAQ", body: "Q: Why can't AI find my podcast?\nA: Audio is not readable by AI answer engines. Only a text transcript and its derivatives can be cited." },
    { type: "LinkedIn article", body: "Your best content is invisible to AI, and here is the fix.\n\nMost experts pour their best thinking into a podcast, then wonder why AI never mentions them..." },
    { type: "Social post - X", body: "Your podcast is invisible to ChatGPT.\n\nNot because it's bad. Because it's audio.\n\nHere's the fix..." },
    { type: "Quote bank", body: "1. \"A transcript sitting on one website does nothing.\" [quote card]\n2. \"AI recommends the name it can read, not the one it can hear.\" [tweet]" },
  ];
}

async function main() {
  const sample = process.argv.includes("--sample");
  const client = config.pilotClientName();

  let items: Item[];
  if (sample) {
    items = sampleItems();
  } else {
    const approved: AssetRow[] = await listAssets("approved");
    items = [];
    for (const a of approved) {
      items.push({ type: a.assetType, body: await readAssetBody(a.id) });
    }
  }

  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const html = render(client, generatedAt, items);
  const outDir = join(process.cwd(), "distribution");
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "ready-to-post.html");
  writeFileSync(out, html);
  log.info("Paste pack built", { out, items: items.length, sample });
  console.log(`\nPaste pack written to ${out}\nOpen it in a browser and copy each asset into its platform.\n`);
}

main().catch((err) => {
  log.error("Handoff build crashed", { error: String(err) });
  process.exit(1);
});
