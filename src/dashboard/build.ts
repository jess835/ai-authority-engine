import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "../lib/config.js";
import { log } from "../lib/logger.js";
import { listAssets, type ApprovalStatus, type AssetRow } from "../lib/notion.js";

/**
 * Week 3 deliverable (dashboard): a client-facing view of every asset and its
 * status (generated / pending / approved / published), read straight from the
 * Notion Assets DB and written to a single self-contained HTML file. No server:
 * open it, host it, or regenerate it on the daily timer.
 *
 * Usage:
 *   npm run dashboard              # build from live Notion data
 *   npm run dashboard -- --sample  # build from mock data (no keys), to preview the design
 */

interface DashAsset {
  type: string;
  approval: ApprovalStatus;
  destination: string | null;
  url: string | null;
}
interface DashEpisode {
  title: string;
  assets: DashAsset[];
}

const STATUSES: ApprovalStatus[] = ["pending", "approved", "published", "rejected"];

function splitName(name: string): { episode: string; type: string } {
  const i = name.lastIndexOf(" — ");
  if (i === -1) return { episode: name, type: "" };
  return { episode: name.slice(0, i), type: name.slice(i + 3) };
}

function groupByEpisode(rows: AssetRow[]): DashEpisode[] {
  const map = new Map<string, DashEpisode>();
  for (const r of rows) {
    const { episode, type } = splitName(r.name);
    if (!map.has(episode)) map.set(episode, { title: episode, assets: [] });
    map.get(episode)!.assets.push({
      type: type || r.assetType,
      approval: r.approval,
      destination: r.destination,
      url: r.publishedUrl,
    });
  }
  return [...map.values()];
}

function counts(rows: AssetRow[]) {
  const c: Record<string, number> = { total: rows.length };
  for (const s of STATUSES) c[s] = rows.filter((r) => r.approval === s).length;
  return c;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!));
}

function render(client: string, generatedAt: string, rows: AssetRow[]): string {
  const c = counts(rows);
  const episodes = groupByEpisode(rows);
  const tiles = [
    { label: "Total assets", value: c.total, cls: "n" },
    { label: "Pending review", value: c.pending, cls: "pending" },
    { label: "Approved", value: c.approved, cls: "approved" },
    { label: "Published", value: c.published, cls: "published" },
  ]
    .map((t) => `<div class="tile ${t.cls}"><div class="v">${t.value}</div><div class="l">${esc(t.label)}</div></div>`)
    .join("");

  const cards = episodes
    .map((ep) => {
      const chips = ep.assets
        .map((a) => {
          const link = a.url ? ` <a href="${esc(a.url)}" target="_blank" rel="noopener">view</a>` : "";
          return `<tr><td>${esc(a.type)}</td><td><span class="chip ${a.approval}">${a.approval}</span></td><td>${esc(a.destination ?? "")}${link}</td></tr>`;
        })
        .join("");
      return `<section class="card"><h2>${esc(ep.title)}</h2><table><thead><tr><th>Asset</th><th>Status</th><th>Destination</th></tr></thead><tbody>${chips}</tbody></table></section>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(client)} — Content Dashboard</title><style>
:root{--bg:#faf9f7;--card:#fff;--border:#e5e5e2;--text:#191918;--muted:#74736e;--n:#2563eb;--pending:#b45309;--approved:#2563eb;--published:#15803d;--rejected:#9ca3af}
@media(prefers-color-scheme:dark){:root{--bg:#191817;--card:#232320;--border:#38382f;--text:#ededea;--muted:#a3a29b;--n:#7ea6ff;--pending:#f0b36a;--approved:#7ea6ff;--published:#6dd58c;--rejected:#8a8a84}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:28px}
.wrap{max-width:900px;margin:0 auto}h1{font-size:22px;margin:0 0 2px}.sub{color:var(--muted);font-size:13px;margin-bottom:22px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:26px}
.tile{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px}
.tile .v{font-size:26px;font-weight:700}.tile .l{color:var(--muted);font-size:12px;margin-top:2px}
.tile.pending .v{color:var(--pending)}.tile.approved .v{color:var(--approved)}.tile.published .v{color:var(--published)}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:14px}
.card h2{font-size:15px;margin:0 0 10px}table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:var(--muted);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--border)}
td{padding:7px 8px;border-bottom:1px solid var(--border)}tr:last-child td{border-bottom:none}
.chip{font-size:12px;font-weight:600;padding:2px 9px;border-radius:20px;text-transform:capitalize}
.chip.pending{background:color-mix(in srgb,var(--pending) 18%,transparent);color:var(--pending)}
.chip.approved{background:color-mix(in srgb,var(--approved) 18%,transparent);color:var(--approved)}
.chip.published{background:color-mix(in srgb,var(--published) 18%,transparent);color:var(--published)}
.chip.rejected{background:color-mix(in srgb,var(--rejected) 22%,transparent);color:var(--rejected)}
a{color:var(--n)}@media(max-width:600px){.tiles{grid-template-columns:repeat(2,1fr)}}
</style></head><body><div class="wrap">
<h1>${esc(client)}</h1><div class="sub">Content pipeline dashboard · generated ${esc(generatedAt)}</div>
<div class="tiles">${tiles}</div>
${cards || '<div class="card">No assets yet. Run generation to populate this dashboard.</div>'}
</div></body></html>`;
}

function sampleRows(): AssetRow[] {
  const ep = "Your Best Content Is Invisible to AI, Here's the Fix";
  const mk = (type: string, approval: ApprovalStatus, destination: string | null, url: string | null): AssetRow => ({
    id: type, name: `${ep} — ${type}`, assetType: type, approval, destination, publishedUrl: url, sourceTitle: ep,
  });
  return [
    mk("SEO titles", "published", "website", "https://example.com/eforge/ai-visibility"),
    mk("AI-search summary", "published", "website", "https://example.com/eforge/ai-visibility"),
    mk("LinkedIn article", "approved", "linkedin", null),
    mk("Medium article", "pending", "medium", null),
    mk("Social post - X", "approved", "social", null),
    mk("Social post - LinkedIn", "pending", "social", null),
    mk("FAQ", "published", "website", "https://example.com/eforge/faq"),
    mk("Tags", "published", "youtube", null),
    mk("Entity map", "approved", "internal", null),
    mk("Quote bank", "pending", "internal", null),
  ];
}

async function main() {
  const sample = process.argv.includes("--sample");
  const client = config.pilotClientName();
  const rows = sample ? sampleRows() : await listAssets();
  const generatedAt = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const html = render(client, generatedAt, rows);
  const outDir = join(process.cwd(), "dashboard");
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "index.html");
  writeFileSync(out, html);
  log.info("Dashboard built", { out, assets: rows.length, sample });
  console.log(`\nDashboard written to ${out}\nOpen it in a browser to view.\n`);
}

main().catch((err) => {
  log.error("Dashboard build crashed", { error: String(err) });
  process.exit(1);
});
