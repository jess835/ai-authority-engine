import { log } from "../lib/logger.js";
import { listAssets, readAssetBody, setAssetPublished } from "../lib/notion.js";
import { getPublisherForType, submitToBing } from "./publish.js";

/**
 * Week 3 distribution: auto-publish every APPROVED asset that has a configured
 * platform (WordPress, X, Facebook, LinkedIn), via that platform's own API in code.
 * Anything without a wired platform is left approved and picked up by the paste pack
 * (`npm run handoff`). So automation is progressive: wire a platform and it drops out
 * of the paste pack; leave it unwired and it stays a paste. Nothing ever breaks.
 *
 * Usage:
 *   npm run publish
 */
async function main() {
  const approved = await listAssets("approved");
  if (approved.length === 0) {
    log.info("Nothing approved to publish");
    return;
  }

  const summary = { published: 0, failed: 0, pastePack: 0, indexed: 0 };
  const leftovers: string[] = [];

  for (const asset of approved) {
    const publisher = getPublisherForType(asset.assetType);
    if (!publisher) {
      // No wired platform for this asset type: it belongs in the paste pack.
      summary.pastePack++;
      leftovers.push(asset.assetType);
      continue;
    }
    try {
      const body = await readAssetBody(asset.id);
      const result = await publisher.publish({ assetType: asset.assetType, title: asset.name, body });
      if (!result.ok) {
        log.error("Auto-publish failed", { asset: asset.name, channel: publisher.channel, note: result.note });
        summary.failed++;
        leftovers.push(asset.assetType);
        continue;
      }
      if (result.url && publisher.channel === "wordpress") {
        if (await submitToBing(result.url)) summary.indexed++;
      }
      await setAssetPublished(asset.id, publisher.channel, result.url);
      summary.published++;
      log.info("Auto-published", { asset: asset.name, channel: publisher.channel, url: result.url });
    } catch (err) {
      log.error("Auto-publish error", { asset: asset.name, error: String(err) });
      summary.failed++;
      leftovers.push(asset.assetType);
    }
  }

  log.info("Publish run complete", summary);
  console.log(`\nAuto-published: ${summary.published}  ·  indexed on Bing: ${summary.indexed}  ·  failed: ${summary.failed}`);
  if (summary.pastePack > 0 || summary.failed > 0) {
    console.log(
      `\n${summary.pastePack + summary.failed} asset(s) still need posting by hand ` +
        "(no wired platform, or a platform with no API). Run: npm run handoff\n"
    );
  } else {
    console.log("\nEverything approved was auto-published. Run npm run dashboard to update the client view.\n");
  }
}

main().catch((err) => {
  log.error("Publish run crashed", { error: String(err) });
  process.exit(1);
});
