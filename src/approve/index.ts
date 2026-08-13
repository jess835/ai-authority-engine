import { log } from "../lib/logger.js";
import { listAssets, setAssetApproval, type ApprovalStatus } from "../lib/notion.js";

/**
 * Week 3 deliverable (approval half): the human gate. Review what is pending and
 * flip assets to approved or rejected. You can equally do this straight in Notion
 * by changing the Approval Status toggle; this CLI just makes it scriptable and
 * easy to drive from Claude Code ("show me what's pending", "approve them all").
 *
 * Usage:
 *   npm run approve                        # list everything pending review
 *   npm run approve -- --approve all       # approve every pending asset
 *   npm run approve -- --approve <pageId>  # approve one asset
 *   npm run approve -- --reject  <pageId>  # reject one asset
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  return { approve: get("--approve"), reject: get("--reject") };
}

async function listPending() {
  const pending = await listAssets("pending");
  if (pending.length === 0) {
    console.log("\nNothing pending. All assets are approved, rejected, or published.\n");
    return;
  }
  console.log(`\n${pending.length} asset(s) awaiting your review:\n`);
  for (const a of pending) {
    console.log(`  ${a.assetType.padEnd(24)} ${a.name}`);
    console.log(`        id: ${a.id}`);
  }
  console.log(
    "\nApprove all:  npm run approve -- --approve all" +
      "\nApprove one:  npm run approve -- --approve <id>" +
      "\nReject one:   npm run approve -- --reject <id>\n"
  );
}

async function setMany(ids: string[], status: ApprovalStatus) {
  for (const id of ids) {
    await setAssetApproval(id, status);
    log.info(`Asset ${status}`, { id });
  }
  console.log(`\n${ids.length} asset(s) set to ${status}.\n`);
}

async function main() {
  const { approve, reject } = parseArgs();

  if (reject) {
    await setMany([reject], "rejected");
    return;
  }
  if (approve) {
    if (approve === "all") {
      const pending = await listAssets("pending");
      await setMany(pending.map((a) => a.id), "approved");
    } else {
      await setMany([approve], "approved");
    }
    return;
  }
  await listPending();
}

main().catch((err) => {
  log.error("Approve command crashed", { error: String(err) });
  process.exit(1);
});
