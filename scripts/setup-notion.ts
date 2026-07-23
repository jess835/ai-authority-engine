import { config } from "../src/lib/config.js";
import { log } from "../src/lib/logger.js";
import { createClientDatabases } from "../src/lib/notion.js";

/**
 * One-time: create the per-client Sources + Assets databases under
 * NOTION_PARENT_PAGE_ID, then print the two DB IDs to paste into .env.
 *
 * The parent page must be shared with your Notion integration first
 * (page ... Connections ... add your integration), or Notion returns 404.
 */
async function main() {
  const parent = config.notionParentPageId();
  const client = config.pilotClientName();
  log.info("Creating client databases", { parent, client });

  const { sourcesDbId, assetsDbId } = await createClientDatabases(parent, client);

  console.log("\nDatabases created. Add these to your .env:\n");
  console.log(`SOURCES_DB_ID=${sourcesDbId}`);
  console.log(`ASSETS_DB_ID=${assetsDbId}\n`);
  log.info("Setup complete", { sourcesDbId, assetsDbId });
}

main().catch((err) => {
  log.error("Notion setup failed", { error: String(err) });
  console.error(
    "\nCommon cause: the parent page is not shared with your integration.\n" +
      "Open the page in Notion -> ... menu -> Connections -> add your integration, then retry.\n"
  );
  process.exit(1);
});
