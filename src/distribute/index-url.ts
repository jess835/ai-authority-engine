import { log } from "../lib/logger.js";
import { submitToBing } from "./publish.js";

/**
 * Submit a published page URL to Bing Webmaster Tools for indexing, in code
 * (direct API, no Make/Zapier). Use after you post a page to the client's site.
 *
 * Usage:
 *   npm run index -- https://clientsite.com/episode-page
 */
async function main() {
  const url = process.argv[2];
  if (!url || !/^https?:\/\//.test(url)) {
    console.error("Usage: npm run index -- <https-url>");
    process.exit(1);
  }
  const ok = await submitToBing(url);
  if (ok) {
    console.log(`\nSubmitted to Bing: ${url}\n`);
  } else {
    console.log(
      "\nNot submitted. Set BING_WEBMASTER_API_KEY and BING_SITE_URL in .env first,\n" +
        "or submit the URL by hand in Bing Webmaster Tools.\n"
    );
  }
}

main().catch((err) => {
  log.error("Bing index command crashed", { error: String(err) });
  process.exit(1);
});
