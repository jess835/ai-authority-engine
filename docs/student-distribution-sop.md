# AI Authority Engine — Distribution SOP (where the content goes, and how)

Distribution is where your client's content actually reaches the places AI models read.
It is the messiest part of the whole system, because every platform plays by different
rules. Read this once and it will make sense every week after. This SOP covers only what
happens to assets you have already approved. Reviewing and approving is in the weekly
operating SOP.

The golden rule: **you approve in Notion, then you distribute.** Nothing here happens to
an asset until you have marked it approved.

---

## The distribution map: where each of the 18 assets goes

The engine already knows the destination for every asset. Here is the full map so you can
see the plan at a glance.

**Your client's website or blog (the home base, most important):**
- SEO titles
- AI-search summary
- FAQ
- Internal-linking map (this one is instructions, see below)

**YouTube (the episode's own video):**
- YouTube description
- Chapters
- Tags
- Pinned comment

**LinkedIn:**
- LinkedIn article
- LinkedIn social post

**Medium:**
- Medium article

**Other social (X, Instagram, Facebook):**
- X post and thread
- Instagram captions and carousel
- Facebook posts

**Working material (not posted as-is, it feeds other work):**
- Clip ideas
- Quote bank
- PDF guide outline
- Entity map

---

## The two ways content goes out

No Make, no Zapier, no n8n, no third-party automation tool anywhere. Distribution is just
these two things.

**1. The paste pack (default, zero tools).** Run `npm run handoff` (or tell Claude Code
"build the paste pack"). The engine writes a single page, `distribution/ready-to-post.html`,
with every approved asset grouped by platform in posting order, each with a one-click Copy
button. You open it and paste each piece into its platform. No API keys, no external tools,
works on day one for every client and every platform.

**2. Direct code publishing (optional upgrade).** Two destinations have clean official
APIs, so the engine can post to them directly in its own code, no middleman: the client's
website (through its CMS API, for example WordPress) and Bing indexing. Switch these on
when you want to stop pasting the website. Everything else (LinkedIn, Medium, Substack,
YouTube fields, social) has no clean API for anyone, so those stay in the paste pack. That
is not a limitation of this tool, it is how those platforms work for everyone. Make and
Zapier cannot post to them cleanly either, which is exactly why we do not use them.

You can deliver the full service with the paste pack alone. The direct publisher is a
convenience you add later, not a requirement.

---

## Destination by destination

### 1. The client's website or blog (do this first, every time)

This is the single highest-leverage step. When the transcript, the AI-search summary, and
the FAQ live on the client's own site, that is what ChatGPT, Claude, and Perplexity cite.
Everything else amplifies this.

- **AI-search summary** and **FAQ**: publish these onto the episode's page or post. These
  are written to be quoted by AI answer engines.
- **SEO titles**: use the best one as the page title and meta title.
- **Internal-linking map**: this is not a page. It is a short set of instructions for
  whoever manages the site, telling them which existing pages should link to this one and
  what anchor text to use. Hand it to them or apply it yourself.
- **Then submit the page to Bing** so it gets indexed. Run `npm run index -- <page-url>`,
  or submit it by hand in Bing Webmaster Tools.

Automatic if the direct website publisher is switched on for their CMS (WordPress, Webflow,
Ghost). Otherwise paste the website assets from the paste pack into their CMS. Five minutes.

### 2. YouTube (the episode video)

Paste into the video in YouTube Studio. There is no safe automatic path, so this is always
manual, and it is quick.

- **Description** into the description box.
- **Chapters** into the description too (they become clickable once timestamps are set).
- **Tags** into the tags field.
- **Pinned comment**: post it as a comment and pin it.

### 3. LinkedIn

LinkedIn blocks clean automation, so this is paste, or scheduled through a tool if you use
one.

- **LinkedIn article**: paste into LinkedIn's article editor and publish.
- **LinkedIn social post**: post it, or schedule it.

### 4. Medium

- **Medium article**: paste into a new Medium story. If the same article is also on the
  client's blog, set Medium's canonical link to the blog version so the client's own site
  gets the SEO credit. Two minutes.

### 5. Substack (only if your client uses it)

The engine does not write a Substack-specific asset, but the Medium or LinkedIn article
works as a newsletter issue. Paste it in. Substack has no clean automatic posting either,
so this is manual.

### 6. Other social: X, Instagram, Facebook

- **X**: the standalone posts and the thread.
- **Instagram**: the captions and the carousel outline (the carousel still needs designing).
- **Facebook**: the posts.

Copy these from the paste pack and schedule them, or hand them to the client to post.
Spread them across the week rather than dumping them all at once.

### 7. Working material (not published directly)

These are not posts. They feed other work:

- **Clip ideas**: give to whoever cuts the short-form video.
- **Quote bank**: turn the best lines into quote graphics.
- **PDF guide outline**: build it into the downloadable lead magnet.
- **Entity map**: keep as an SEO reference for the client's topic authority.

---

## The optional direct publishers (code, not Make)

You do not need these to deliver the service. They just remove the two pastes worth
automating, and both are plain code in this project, not a third-party tool.

- **Website (direct code):** the client's CMS almost certainly has its own API (WordPress,
  Webflow, and Ghost all do). A small publisher in this project posts the page straight to
  their site, no middleman. Tell your coach which CMS the client uses and they switch it on.
  Until then, paste the website assets from the paste pack.
- **Bing indexing (direct code):** once a page is live, run `npm run index -- <page-url>`
  to submit it to Bing (set `BING_WEBMASTER_API_KEY` and `BING_SITE_URL` in `.env` once).
  This is where AI answer engines look, so it is worth doing. You can also submit URLs by
  hand in Bing Webmaster Tools.

That is the entire automation story: two code publishers you can turn on, and a paste pack
for everything else. Nothing else to install, subscribe to, or maintain.

---

## Your weekly distribution checklist

First run `npm run handoff` and open `distribution/ready-to-post.html`. That is your
worksheet: everything approved, grouped by platform, with copy buttons. Then work down it
in this order. Website first is deliberate, it is the highest-value step.

1. **Website**: publish the AI-search summary and FAQ onto the episode page, set the title,
   apply the internal links. Submit the page URL to Bing.
2. **YouTube**: paste the description, chapters, tags, and pinned comment.
3. **LinkedIn**: publish the article and the post.
4. **Medium**: publish the article, canonical link pointing to the client's site.
5. **Social**: schedule the X, Instagram, and Facebook posts across the week.
6. **Working material**: hand off clip ideas, quotes, the PDF outline.
7. **Dashboard**: update it and send it to the client so they see it all went live.

That is the full distribution. Once the direct website publisher is switched on, step 1
happens on its own, and your weekly job shrinks to a few pastes and a review.
