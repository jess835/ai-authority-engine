import { optionalEnv } from "../lib/config.js";
import { log } from "../lib/logger.js";

export interface PublishPayload {
  name: string;
  assetType: string;
  destination: string;
  body: string;
}

export interface PublishResult {
  ok: boolean;
  url?: string;
  note?: string;
}

/**
 * A publisher takes an approved asset and sends it to its destination. Providers
 * sit behind this one interface (BUILD_PLAN section 10) so the messy last mile
 * (LinkedIn, Medium, Substack) can be whatever the agency wires up, without the
 * pipeline needing to know.
 */
export interface Publisher {
  name: string;
  available(): boolean;
  publish(payload: PublishPayload): Promise<PublishResult>;
}

/**
 * Default publisher: POST the asset to a single outbound webhook the agency owns
 * (their CMS endpoint, or a Make/Zapier/n8n scenario that does the actual posting).
 * This keeps the core pipeline in code while sidestepping the platform-API walls.
 * The webhook may return JSON with a { "url": "..." } of the published page.
 */
class WebhookPublisher implements Publisher {
  name = "webhook";
  private url = optionalEnv("PUBLISH_WEBHOOK_URL");
  available() {
    return !!this.url;
  }
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, note: `webhook HTTP ${res.status}` };
    let url: string | undefined;
    try {
      const data = (await res.json()) as { url?: string };
      url = data?.url;
    } catch {
      // webhook returned no/invalid JSON; that is fine, publish still succeeded
    }
    return { ok: true, url };
  }
}

let _publisher: Publisher | null | undefined;

/** The configured publisher, or null if none is set up yet. */
export function getPublisher(): Publisher | null {
  if (_publisher !== undefined) return _publisher;
  const wh = new WebhookPublisher();
  _publisher = wh.available() ? wh : null;
  return _publisher;
}

/**
 * Submit a published URL to Bing Webmaster Tools so new pages get indexed where
 * AI answer engines pull from (BUILD_PLAN section 6). No-op if unconfigured.
 */
export async function submitToBing(url: string): Promise<boolean> {
  const apiKey = optionalEnv("BING_WEBMASTER_API_KEY");
  const siteUrl = optionalEnv("BING_SITE_URL");
  if (!apiKey || !siteUrl) return false;
  try {
    const res = await fetch(
      `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl?apikey=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteUrl, url }),
      }
    );
    if (!res.ok) {
      log.warn("Bing submit failed", { status: res.status, url });
      return false;
    }
    log.info("Submitted URL to Bing for indexing", { url });
    return true;
  } catch (err) {
    log.warn("Bing submit error", { error: String(err), url });
    return false;
  }
}
