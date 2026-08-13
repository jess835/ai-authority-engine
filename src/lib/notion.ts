import { Client } from "@notionhq/client";
import { config } from "./config.js";
import { log } from "./logger.js";

export type SourceType = "podcast" | "youtube" | "blog";
export type SourceStatus =
  | "detected"
  | "transcribed"
  | "generated"
  | "approved"
  | "published";

let _client: Client | null = null;
function notion(): Client {
  if (!_client) _client = new Client({ auth: config.notionKey() });
  return _client;
}

const STATUS_OPTIONS: SourceStatus[] = [
  "detected", "transcribed", "generated", "approved", "published",
];
const APPROVAL_OPTIONS = ["pending", "approved", "rejected", "published"];

/** The 18 derivative asset types (BUILD_PLAN section 7) — used for the Assets DB select. */
export const ASSET_TYPES = [
  "SEO titles", "YouTube description", "Chapters", "Tags", "Pinned comment",
  "Clip ideas", "AI-search summary", "LinkedIn article", "Medium article",
  "Social post - X", "Social post - LinkedIn", "Social post - Instagram",
  "Social post - Facebook", "Quote bank", "FAQ", "PDF guide outline",
  "Entity map", "Internal-linking map",
];

/** Create the per-client Sources + Assets databases under the parent page. */
export async function createClientDatabases(parentPageId: string, clientName: string) {
  const n = notion();

  const sources = await n.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: `${clientName} — Sources` } }],
    properties: {
      Title: { title: {} },
      "Source Type": {
        select: { options: [
          { name: "podcast", color: "blue" },
          { name: "youtube", color: "red" },
          { name: "blog", color: "green" },
        ] },
      },
      "Source URL": { url: {} },
      "Published Date": { date: {} },
      Status: { select: { options: STATUS_OPTIONS.map((name) => ({ name })) } },
      "Raw Audio URL": { url: {} },
      "Transcript Provider": { rich_text: {} },
    },
  });

  const assets = await n.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: `${clientName} — Assets` } }],
    properties: {
      Name: { title: {} },
      "Asset Type": { select: { options: ASSET_TYPES.map((name) => ({ name })) } },
      Body: { rich_text: {} },
      "Approval Status": { select: { options: APPROVAL_OPTIONS.map((name) => ({ name })) } },
      Destination: { rich_text: {} },
      "Published URL": { url: {} },
      "Published At": { date: {} },
      Source: { relation: { database_id: sources.id, single_property: {} } },
    },
  });

  return { sourcesDbId: sources.id, assetsDbId: assets.id };
}

/** Look up an existing Source row by its Source URL (dedupe on re-runs). */
export async function findSourceByUrl(url: string): Promise<string | null> {
  const res = await notion().databases.query({
    database_id: config.sourcesDbId(),
    filter: { property: "Source URL", url: { equals: url } },
    page_size: 1,
  });
  return res.results[0]?.id ?? null;
}

/** Split text into <=2000-char paragraph blocks (Notion's per-block limit). */
function toParagraphBlocks(text: string) {
  const blocks: any[] = [];
  for (let i = 0; i < text.length; i += 1900) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: text.slice(i, i + 1900) } }] },
    });
  }
  return blocks;
}

export interface SourceInput {
  title: string;
  sourceType: SourceType;
  sourceUrl: string;
  publishedDate?: string; // ISO
  audioUrl?: string;
  status: SourceStatus;
  transcript?: string;
  transcriptProvider?: string;
}

/** Create a Source row and attach the transcript as page content. */
export async function createSource(input: SourceInput): Promise<string> {
  const n = notion();
  const props: Record<string, any> = {
    Title: { title: [{ text: { content: input.title.slice(0, 2000) } }] },
    "Source Type": { select: { name: input.sourceType } },
    "Source URL": { url: input.sourceUrl },
    Status: { select: { name: input.status } },
  };
  if (input.publishedDate) props["Published Date"] = { date: { start: input.publishedDate } };
  if (input.audioUrl) props["Raw Audio URL"] = { url: input.audioUrl };
  if (input.transcriptProvider)
    props["Transcript Provider"] = {
      rich_text: [{ text: { content: input.transcriptProvider } }],
    };

  const page = await n.pages.create({
    parent: { database_id: config.sourcesDbId() },
    properties: props,
  });

  if (input.transcript) {
    const blocks = [
      {
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: [{ type: "text", text: { content: "Transcript" } }] },
      },
      ...toParagraphBlocks(input.transcript),
    ];
    // Notion append caps at 100 children per request.
    for (let i = 0; i < blocks.length; i += 100) {
      await n.blocks.children.append({
        block_id: page.id,
        children: blocks.slice(i, i + 100) as any,
      });
    }
  }

  log.info("Notion source row created", { pageId: page.id, title: input.title });
  return page.id;
}

export async function setSourceStatus(pageId: string, status: SourceStatus) {
  await notion().pages.update({
    page_id: pageId,
    properties: { Status: { select: { name: status } } },
  });
}

// --- Generation (Week 2) ---

export interface SourceRef {
  id: string;
  title: string;
}

/** List Source rows with a given status (e.g. everything ready to generate). */
export async function listSourcesByStatus(status: SourceStatus): Promise<SourceRef[]> {
  const res = await notion().databases.query({
    database_id: config.sourcesDbId(),
    filter: { property: "Status", select: { equals: status } },
  });
  return res.results.map((p: any) => ({
    id: p.id,
    title: p.properties?.Title?.title?.[0]?.plain_text ?? "(untitled)",
  }));
}

/**
 * Read the transcript back off a Source page. The transcript lives as paragraph
 * blocks under the "Transcript" heading (see createSource). We collect paragraphs
 * that follow that heading and stop at the next heading (e.g. an appended Brief).
 */
export async function readTranscript(pageId: string): Promise<string> {
  const n = notion();
  const paras: string[] = [];
  let inTranscript = false;
  let cursor: string | undefined;
  do {
    const res = await n.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    for (const block of res.results as any[]) {
      const type = block.type;
      if (type === "heading_2") {
        const heading = block.heading_2?.rich_text?.[0]?.plain_text?.toLowerCase() ?? "";
        inTranscript = heading === "transcript";
        continue;
      }
      if (inTranscript && type === "paragraph") {
        const text = (block.paragraph?.rich_text ?? []).map((t: any) => t.plain_text).join("");
        if (text) paras.push(text);
      }
    }
    cursor = res.has_more ? (res.next_cursor as string) : undefined;
  } while (cursor);
  return paras.join("\n").trim();
}

/** Append the generated Brief to the Source page under a "Brief" heading. */
export async function appendBriefToSource(pageId: string, brief: string) {
  const blocks = [
    { object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: "Brief" } }] } },
    ...toParagraphBlocks(brief),
  ];
  for (let i = 0; i < blocks.length; i += 100) {
    await notion().blocks.children.append({ block_id: pageId, children: blocks.slice(i, i + 100) as any });
  }
}

export interface AssetInput {
  sourceId: string;
  assetType: string; // must match ASSET_TYPES
  name: string;
  body: string;
  approvalStatus: "pending" | "approved" | "rejected" | "published";
}

/**
 * Create an Asset row linked to its Source. The full body goes into the page
 * content (no length limit); the Body property holds a short preview.
 */
export async function createAsset(input: AssetInput): Promise<string> {
  const n = notion();
  const page = await n.pages.create({
    parent: { database_id: config.assetsDbId() },
    properties: {
      Name: { title: [{ text: { content: input.name.slice(0, 2000) } }] },
      "Asset Type": { select: { name: input.assetType } },
      "Approval Status": { select: { name: input.approvalStatus } },
      Body: { rich_text: [{ text: { content: input.body.slice(0, 1900) } }] },
      Source: { relation: [{ id: input.sourceId }] },
    },
  });
  const blocks = toParagraphBlocks(input.body);
  for (let i = 0; i < blocks.length; i += 100) {
    await n.blocks.children.append({ block_id: page.id, children: blocks.slice(i, i + 100) as any });
  }
  return page.id;
}

// --- Approval + distribution (Week 3) ---

export type ApprovalStatus = "pending" | "approved" | "rejected" | "published";

export interface AssetRow {
  id: string;
  name: string;
  assetType: string;
  approval: ApprovalStatus;
  destination: string | null;
  publishedUrl: string | null;
  sourceTitle: string | null;
}

function assetTitle(p: any): string {
  return p.properties?.Name?.title?.[0]?.plain_text ?? "(untitled)";
}

function readRow(p: any): AssetRow {
  return {
    id: p.id,
    name: assetTitle(p),
    assetType: p.properties?.["Asset Type"]?.select?.name ?? "",
    approval: (p.properties?.["Approval Status"]?.select?.name ?? "pending") as ApprovalStatus,
    destination: p.properties?.Destination?.rich_text?.[0]?.plain_text ?? null,
    publishedUrl: p.properties?.["Published URL"]?.url ?? null,
    sourceTitle: null,
  };
}

/** List Asset rows, optionally filtered by approval status. */
export async function listAssets(status?: ApprovalStatus): Promise<AssetRow[]> {
  const n = notion();
  const rows: AssetRow[] = [];
  let cursor: string | undefined;
  do {
    const res = await n.databases.query({
      database_id: config.assetsDbId(),
      ...(status ? { filter: { property: "Approval Status", select: { equals: status } } } : {}),
      start_cursor: cursor,
      page_size: 100,
    });
    for (const p of res.results as any[]) rows.push(readRow(p));
    cursor = res.has_more ? (res.next_cursor as string) : undefined;
  } while (cursor);
  return rows;
}

/** Read an asset's full body from its page content. */
export async function readAssetBody(pageId: string): Promise<string> {
  const n = notion();
  const paras: string[] = [];
  let cursor: string | undefined;
  do {
    const res = await n.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    for (const b of res.results as any[]) {
      if (b.type === "paragraph") {
        const t = (b.paragraph?.rich_text ?? []).map((x: any) => x.plain_text).join("");
        if (t) paras.push(t);
      }
    }
    cursor = res.has_more ? (res.next_cursor as string) : undefined;
  } while (cursor);
  return paras.join("\n").trim();
}

export async function setAssetApproval(pageId: string, status: ApprovalStatus) {
  await notion().pages.update({
    page_id: pageId,
    properties: { "Approval Status": { select: { name: status } } },
  });
}

/** Mark an asset published, recording its destination and live URL. */
export async function setAssetPublished(pageId: string, destination: string, url?: string) {
  const props: Record<string, any> = {
    "Approval Status": { select: { name: "published" } },
    Destination: { rich_text: [{ text: { content: destination } }] },
    "Published At": { date: { start: new Date().toISOString() } },
  };
  if (url) props["Published URL"] = { url };
  await notion().pages.update({ page_id: pageId, properties: props });
}
