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

// Each platform: the assets that go there, a direct link to the posting screen, and a
// one-line "how to post this" so a non-technical student never has to hunt.
interface Platform {
  name: string;
  how: string;
  links: { label: string; url: string }[];
  types: string[];
}
const PLATFORMS: Platform[] = [
  {
    name: "Website / blog",
    how: "Do this first, it is what AI engines cite. In your client's site editor, publish the AI-search summary and FAQ on the episode page, set the best SEO title, and apply the internal links.",
    links: [],
    types: ["SEO titles", "AI-search summary", "FAQ", "Internal-linking map"],
  },
  {
    name: "YouTube",
    how: "Open the episode in YouTube Studio. Paste the description and chapters into the description box, add the tags, then post the pinned comment and pin it.",
    links: [{ label: "Open YouTube Studio", url: "https://studio.youtube.com" }],
    types: ["YouTube description", "Chapters", "Tags", "Pinned comment"],
  },
  {
    name: "LinkedIn",
    how: "For the article, click Write article, paste, publish. For the post, use the start-a-post box.",
    links: [
      { label: "New LinkedIn article", url: "https://www.linkedin.com/article/new/" },
      { label: "LinkedIn feed", url: "https://www.linkedin.com/feed/" },
    ],
    types: ["LinkedIn article", "Social post - LinkedIn"],
  },
  {
    name: "Medium",
    how: "New story, paste, then under the ... menu set the canonical link to the same article on the client's blog so their site gets the SEO credit.",
    links: [{ label: "New Medium story", url: "https://medium.com/new-story" }],
    types: ["Medium article"],
  },
  {
    name: "X",
    how: "Paste each standalone post. For the thread, post the parts in order as replies.",
    links: [{ label: "Compose on X", url: "https://x.com/compose/post" }],
    types: ["Social post - X"],
  },
  {
    name: "Instagram",
    how: "Instagram posts from your phone. Paste the caption, and design the carousel from the outline.",
    links: [{ label: "Open Instagram", url: "https://www.instagram.com" }],
    types: ["Social post - Instagram"],
  },
  {
    name: "Facebook",
    how: "Paste each post onto the client's Facebook page.",
    links: [{ label: "Open Facebook", url: "https://www.facebook.com" }],
    types: ["Social post - Facebook"],
  },
  {
    name: "Working material (not posted as-is)",
    how: "These are not posts. Hand them to whoever needs them: clips to the video editor, quotes to the designer, the PDF outline to build the lead magnet.",
    links: [],
    types: ["Clip ideas", "Quote bank", "PDF guide outline", "Entity map"],
  },
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
  let total = 0;
  const sections = PLATFORMS.map((p) => {
    const present = p.types.filter((t) => byType.has(t));
    if (present.length === 0) return "";
    const cards = present
      .map((t) => {
        total++;
        const body = byType.get(t)!.body;
        const key = esc(generatedAt + "|" + t);
        return `<div class="card"><div class="chead"><label class="ct"><input type="checkbox" data-done data-key="${key}"> ${esc(t)}</label><button class="copy" data-copy>Copy</button></div><pre>${esc(body)}</pre></div>`;
      })
      .join("");
    const links = p.links
      .map((l) => `<a class="open" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
      .join("");
    return `<section><div class="phead"><h2>${esc(p.name)}</h2><div class="links">${links}</div></div><p class="how">${esc(p.how)}</p>${cards}</section>`;
  }).join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(client)} — Ready to Post</title><style>
:root{--bg:#faf9f7;--card:#fff;--border:#e5e5e2;--text:#191918;--muted:#74736e;--accent:#2563eb;--pre:#f6f6f4;--done:#15803d}
@media(prefers-color-scheme:dark){:root{--bg:#191817;--card:#232320;--border:#38382f;--text:#ededea;--muted:#a3a29b;--accent:#7ea6ff;--pre:#1b1b18;--done:#6dd58c}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:28px}
.wrap{max-width:820px;margin:0 auto}h1{font-size:22px;margin:0 0 2px}.sub{color:var(--muted);font-size:13px;margin-bottom:16px}
.progress{position:sticky;top:0;background:var(--bg);padding:10px 0;font-size:13px;font-weight:600;color:var(--muted);margin-bottom:12px;border-bottom:1px solid var(--border)}
.progress b{color:var(--done)}
section{margin-bottom:28px}.phead{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap}
h2{font-size:16px;margin:0}.links{display:flex;gap:8px;flex-wrap:wrap}
.open{font-size:12px;font-weight:600;color:var(--accent);text-decoration:none;border:1px solid var(--border);border-radius:8px;padding:3px 10px}
.how{color:var(--muted);font-size:12.5px;margin:4px 0 12px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:12px}
.card.done{opacity:.55}
.chead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:10px}
.ct{font-weight:600;font-size:14px;display:flex;align-items:center;gap:8px;cursor:pointer}
.ct input{width:16px;height:16px;accent-color:var(--done)}
.copy{font:600 12px inherit;color:var(--accent);background:transparent;border:1px solid var(--border);border-radius:8px;padding:4px 12px;cursor:pointer}
.copy.copied{color:var(--done)}
pre{white-space:pre-wrap;word-wrap:break-word;background:var(--pre);border-radius:8px;padding:12px;margin:0;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
</style></head><body><div class="wrap">
<h1>${esc(client)} — Ready to Post</h1><div class="sub">Approved assets, in posting order · generated ${esc(generatedAt)}.</div>
<div class="progress"><b id="pc">0</b> of ${total} posted. Go down the list: Open the platform, Copy, paste, tick it off.</div>
${sections || '<div class="card">Nothing approved yet. Approve assets in Notion, then run this again.</div>'}
</div>
<script>
function refresh(){var b=document.querySelectorAll("[data-done]:checked").length;document.getElementById("pc").textContent=b;}
document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){var t=b.closest(".card").querySelector("pre").innerText;navigator.clipboard.writeText(t).then(function(){b.textContent="Copied";b.classList.add("copied");setTimeout(function(){b.textContent="Copy";b.classList.remove("copied")},1500)})})});
document.querySelectorAll("[data-done]").forEach(function(c){var k="aae:"+c.getAttribute("data-key");if(localStorage.getItem(k)==="1"){c.checked=true;c.closest(".card").classList.add("done");}c.addEventListener("change",function(){c.closest(".card").classList.toggle("done",c.checked);localStorage.setItem(k,c.checked?"1":"0");refresh();});});
refresh();
</script>
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
