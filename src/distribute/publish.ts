import { optionalEnv } from "../lib/config.js";
import { log } from "../lib/logger.js";

export interface PublishItem {
  assetType: string;
  title: string; // the asset's Notion name (episode + type)
  body: string;
}

export interface PublishResult {
  ok: boolean;
  url?: string;
  note?: string;
}

/**
 * A channel publisher posts to one platform via that platform's own official API,
 * in code (no Make/Zapier). Each is gated on its credentials: if they are not set,
 * the channel is unavailable and the asset falls back to the paste pack, so nothing
 * ever breaks. Setup for each platform is in docs/student-automated-publishing-sop.md.
 */
export interface ChannelPublisher {
  channel: string;
  available(): boolean;
  publish(item: PublishItem): Promise<PublishResult>;
}

/** Which asset types can auto-publish, and to which channel. Everything else -> paste pack. */
const CHANNEL_BY_TYPE: Record<string, string> = {
  "AI-search summary": "wordpress", // becomes the episode's web page (title from SEO titles)
  "Social post - X": "x",
  "Social post - Facebook": "facebook",
  "Social post - LinkedIn": "linkedin",
  // Instagram (needs an image, no text-only API), articles, Medium, Substack,
  // YouTube fields and working material intentionally have no auto channel yet.
};

export function channelForType(assetType: string): string | null {
  return CHANNEL_BY_TYPE[assetType] ?? null;
}

// --- WordPress: clean official REST API + application password. The robust one. ---
class WordPressPublisher implements ChannelPublisher {
  channel = "wordpress";
  private base = optionalEnv("WORDPRESS_URL").replace(/\/$/, "");
  private user = optionalEnv("WORDPRESS_USER");
  private pass = optionalEnv("WORDPRESS_APP_PASSWORD");
  available() {
    return !!(this.base && this.user && this.pass);
  }
  async publish(item: PublishItem): Promise<PublishResult> {
    const auth = Buffer.from(`${this.user}:${this.pass}`).toString("base64");
    const res = await fetch(`${this.base}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        content: item.body.replace(/\n/g, "<br>\n"),
        status: "publish",
      }),
    });
    if (!res.ok) return { ok: false, note: `WordPress HTTP ${res.status}` };
    const data = (await res.json()) as { link?: string };
    return { ok: true, url: data.link };
  }
}

// --- X (Twitter) v2, OAuth2 user token with tweet.write. Requires a paid X API tier. ---
class XPublisher implements ChannelPublisher {
  channel = "x";
  private token = optionalEnv("X_ACCESS_TOKEN");
  available() {
    return !!this.token;
  }
  async publish(item: PublishItem): Promise<PublishResult> {
    // Posts only the first block; threads should be posted from the paste pack for now.
    const text = item.body.split("\n\n")[0].slice(0, 280);
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { ok: false, note: `X HTTP ${res.status}` };
    const data = (await res.json()) as { data?: { id?: string } };
    return { ok: true, url: data.data?.id ? `https://x.com/i/status/${data.data.id}` : undefined };
  }
}

// --- Facebook Page via the Graph API + a Page access token. Needs Meta app review. ---
class FacebookPublisher implements ChannelPublisher {
  channel = "facebook";
  private pageId = optionalEnv("FACEBOOK_PAGE_ID");
  private token = optionalEnv("FACEBOOK_PAGE_TOKEN");
  available() {
    return !!(this.pageId && this.token);
  }
  async publish(item: PublishItem): Promise<PublishResult> {
    const res = await fetch(`https://graph.facebook.com/v21.0/${this.pageId}/feed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: item.body, access_token: this.token }),
    });
    if (!res.ok) return { ok: false, note: `Facebook HTTP ${res.status}` };
    const data = (await res.json()) as { id?: string };
    return { ok: true, url: data.id ? `https://facebook.com/${data.id}` : undefined };
  }
}

// --- LinkedIn member post via the Posts API. Requires w_member_social + app approval. ---
class LinkedInPublisher implements ChannelPublisher {
  channel = "linkedin";
  private token = optionalEnv("LINKEDIN_ACCESS_TOKEN");
  private author = optionalEnv("LINKEDIN_AUTHOR_URN"); // e.g. urn:li:person:xxxx
  available() {
    return !!(this.token && this.author);
  }
  async publish(item: PublishItem): Promise<PublishResult> {
    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        "LinkedIn-Version": "202501",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: this.author,
        commentary: item.body,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: "PUBLISHED",
      }),
    });
    if (!res.ok) return { ok: false, note: `LinkedIn HTTP ${res.status}` };
    return { ok: true, url: res.headers.get("x-restli-id") ?? undefined };
  }
}

const REGISTRY: Record<string, ChannelPublisher> = {};
for (const p of [new WordPressPublisher(), new XPublisher(), new FacebookPublisher(), new LinkedInPublisher()]) {
  REGISTRY[p.channel] = p;
}

/** Get the publisher for an asset type, only if it exists AND its credentials are set. */
export function getPublisherForType(assetType: string): ChannelPublisher | null {
  const channel = channelForType(assetType);
  if (!channel) return null;
  const pub = REGISTRY[channel];
  return pub && pub.available() ? pub : null;
}

/**
 * Submit a published page URL to Bing Webmaster Tools for indexing (direct API).
 * No-op if unconfigured.
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
