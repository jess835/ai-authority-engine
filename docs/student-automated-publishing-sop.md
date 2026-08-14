# AI Authority Engine — Automated Publishing SOP (advanced)

Read this after the Distribution SOP. This is the advanced guide for the students who want
publishing to be as hands-off as possible, wiring each platform's own API so the engine
posts for them. It is optional. The paste pack already delivers the full service with no
setup, and you can automate one platform at a time whenever you are ready.

## The one rule: wired means automatic, unwired means paste pack

`npm run publish` looks at each approved asset and asks: is this asset's platform wired up
with credentials? If yes, it posts it automatically through that platform's API and marks it
published. If no, it leaves the asset for the paste pack (`npm run handoff`). So automation
is progressive and nothing ever breaks. You start with everything in the paste pack, and
each platform you connect quietly drops out of it.

Your weekly flow becomes:

```
npm run publish     # auto-posts every platform you have wired
npm run handoff     # builds the paste pack for whatever is left
npm run dashboard   # updates the client view
```

## What can and cannot be automated (the honest version)

**Can be automated (official APIs, in code):**
- **Website / blog** through WordPress. Robust and worth doing first.
- **Bing** indexing of your published pages.
- **X (Twitter)** posts, if you pay for an X API tier.
- **Facebook Page** posts, after Meta app review.
- **LinkedIn** posts (not articles), after LinkedIn app approval.

**Cannot be cleanly automated by anyone, including us:**
- **Instagram**: the API cannot post text-only content, only images and video with media you
  upload. Instagram stays in the paste pack.
- **LinkedIn articles, Medium, Substack**: these have no posting API at all. Use the browser
  flow at the bottom of this guide, or paste them. This is true for every tool on the market,
  not just this one.

Everything below is per platform. Do only the ones you want. Each is a one-time setup per
client, and the credentials go in that client's `.env` file.

---

## Website: WordPress (do this one first)

This is the highest value and the most reliable.

1. In the client's WordPress admin, go to **Users -> Profile -> Application Passwords**.
2. Enter a name like `AI Authority Engine` and click **Add New Application Password**.
3. Copy the generated password.
4. In `.env`, set:
   - `WORDPRESS_URL` to the site, e.g. `https://clientsite.com`
   - `WORDPRESS_USER` to a username with author rights
   - `WORDPRESS_APP_PASSWORD` to the password you copied
5. Run `npm run publish`. The AI-search summary becomes a published post, titled from the
   SEO title, and its URL is submitted to Bing automatically.

Not on WordPress? Webflow and Ghost also have clean APIs and can be added the same way; ask
your coach. Squarespace and Wix have weak APIs, so those clients stay on the paste pack.

## Bing indexing

1. In **Bing Webmaster Tools**, add and verify the client's site.
2. Go to **Settings -> API access** and copy the API key.
3. In `.env`, set `BING_WEBMASTER_API_KEY` and `BING_SITE_URL`.
4. From then on, WordPress pages are submitted automatically, or run
   `npm run index -- <page-url>` for any page you posted by hand.

## X (Twitter)

Honest warning: X now charges for API access, and posting requires a paid tier.

1. Create a developer account at the X developer portal and a Project + App.
2. Give the app **Read and Write** permission.
3. Generate an **OAuth 2.0 user access token** with the `tweet.write` scope for the client's
   account.
4. In `.env`, set `X_ACCESS_TOKEN` to that token.
5. `npm run publish` posts the first X post automatically. Threads stay in the paste pack for
   now, since they need to be posted in sequence.

## Facebook Page (and why Instagram cannot)

1. Create a Meta app in the Meta for Developers portal.
2. Add the client's Facebook Page and generate a **Page access token** with `pages_manage_posts`.
3. Meta requires **app review** before it will post to real Pages. Budget time for this.
4. In `.env`, set `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_TOKEN`.
5. `npm run publish` posts to the Page automatically.

Instagram cannot be automated for text posts. Its API only publishes image or video posts
with media you upload, so Instagram captions stay in the paste pack for you to post from
your phone.

## LinkedIn posts (not articles)

1. Create a LinkedIn app in the LinkedIn Developer portal.
2. Request the **Share on LinkedIn** / `w_member_social` permission. LinkedIn reviews this.
3. Complete OAuth for the client's account to get an access token, and note their author URN
   (looks like `urn:li:person:XXXX`).
4. In `.env`, set `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_AUTHOR_URN`.
5. `npm run publish` posts the LinkedIn post automatically. The LinkedIn **article** has no
   API and uses the browser flow below.

---

## The articles: LinkedIn article, Medium, Substack (browser flow)

These have no API. If you do not want to paste them, Claude can drive your browser to place
them for you, with you giving the final click.

1. Make sure you are logged into the platform in your browser, and that Claude has browser
   access (the Claude in Chrome extension).
2. Approve the article in Notion, then tell Claude: "post this LinkedIn article in my
   browser." Claude opens the article editor and fills in the title and body from Notion.
3. **You review it on screen and click Publish yourself.** Claude will not click the final
   publish button for you. Publishing is your decision, every time.

Honest warning: this is the fragile part. Platforms change their pages, logins expire, and it
needs your browser open and signed in. Treat it as a helper that saves the typing, not a
set-and-forget robot. When in doubt, the paste pack is always there and always works.

---

## The tools you need for full automation

The core system needs only Claude Code and the OpenAI and Notion keys. Full automation adds,
only for the platforms you choose to wire:

- A **developer account and app** for each platform you automate (X, Meta, LinkedIn). This is
  real setup and, for X and Meta, involves paid tiers and app review.
- **Bing Webmaster Tools** access for indexing.
- The **Claude in Chrome** extension, only if you use the browser flow for articles.

None of this is required to run the service. Start on the paste pack, wire WordPress and Bing
first (the biggest wins for the least effort), and add the social platforms later if the
volume justifies the setup.
