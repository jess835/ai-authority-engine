import { log } from "../lib/logger.js";
import { listAssets, readAssetBody, setAssetPublished } from "../lib/notion.js";
import { destinationFor, BING_INDEXABLE } from "./routes.js";
import { getPublisher, submitToBing } from "./publish.js";

/**
 * Week 3 deliverable (distribution half): take every APPROVED asset, send it to its
 * destination, submit any resulting web page to Bing, and stamp it published.
 * Only approved assets are ever touched, so approval is the wall before anything
 * goes public.
 *
 * Usage:
 *   npm run publish
 */
async function main() {
  const publisher = getPublisher();
  const approved = await listAssets("approved");

  if (approved.length === 0) {
    log.info("Nothing approved to publish");
    return;
  }
  if (!publisher) {
    log.warn(
      "No publisher configured. Set PUBLISH_WEBHOOK_URL to enable distribution. " +
        `${approved.length} asset(s) are approved and waiting.`
    );
    return;
  }

  log.info("Publishing approved assets", { count: approved.length, via: publisher.name });
  const summary = { published: 0, failed: 0, indexed: 0 };

  for (const asset of approved) {
    const destination = destinationFor(asset.assetType);
    try {
      const body = await readAssetBody(asset.id);
      const result = await publisher.publish({
        name: asset.name,
        assetType: asset.assetType,
        destination,
        body,
      });
      if (!result.ok) {
        log.error("Publish failed", { asset: asset.name, destination, note: result.note });
        summary.failed++;
        continue;
      }
      if (result.url && BING_INDEXABLE.has(destination)) {
        if (await submitToBing(result.url)) summary.indexed++;
      }
      await setAssetPublished(asset.id, destination, result.url);
      summary.published++;
      log.info("Published asset", { asset: asset.name, destination, url: result.url });
    } catch (err) {
      log.error("Publish error", { asset: asset.name, error: String(err) });
      summary.failed++;
    }
  }

  log.info("Publish run complete", summary);
}

main().catch((err) => {
  log.error("Publish run crashed", { error: String(err) });
  process.exit(1);
});
