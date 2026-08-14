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

**1. Automatic**, through your own publishing endpoint. If you connect a publishing
endpoint (covered at the bottom), then "publish the approved assets" pushes those assets
out for you. In practice this reliably covers the client's website and any scheduler you
wire up. Any web page it creates is also submitted to Bing automatically.

**2. Manual paste.** A few platforms (LinkedIn, Medium, Substack, and YouTube's own
fields) do not allow clean automated posting. For these, the engine hands you the finished,
approved text and you paste it in. This is a two-minute copy and paste, not a rewrite,
because the words are already written and approved. This is normal and it is not a
shortcoming, it is how those platforms work for everyone.

Most agencies run a mix: website automatic, the rest pasted, until they decide to wire up
more. You can deliver the full service with zero automation on day one.

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
- **Then submit the page to Bing** so it gets indexed (automatic if your endpoint returns
  the URL, otherwise submit it by hand in Bing Webmaster Tools).

Automatic if your endpoint is wired to the client's CMS (WordPress, Webflow, Ghost, and so
on, directly or through Make/Zapier). Otherwise paste into their CMS. Five minutes.

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

Automatic if you connect a scheduler (for example Buffer) to your endpoint. Otherwise
schedule them by hand, or hand them to the client to post. Spread them across the week
rather than dumping them all at once.

### 7. Working material (not published directly)

These are not posts. They feed other work:

- **Clip ideas**: give to whoever cuts the short-form video.
- **Quote bank**: turn the best lines into quote graphics.
- **PDF guide outline**: build it into the downloadable lead magnet.
- **Entity map**: keep as an SEO reference for the client's topic authority.

---

## Setting up automatic distribution (optional, once per client)

You do not need this to deliver the service, but it removes the pasting over time.

- **Publishing endpoint**: set `PUBLISH_WEBHOOK_URL` in the project to a Make, Zapier, or
  n8n scenario (or a direct CMS endpoint) that you own. When you publish, the engine sends
  each approved asset to that endpoint as simple data (its type, its destination, and its
  text), and your scenario does the actual posting. Start with just the website, then add
  a social scheduler when you are ready. Your coach can help you build this.
- **Bing indexing**: set `BING_WEBMASTER_API_KEY` and `BING_SITE_URL` so new pages are
  submitted for indexing automatically. This is where AI answer engines look, so it is
  worth doing.

Until you set these, everything still works. The engine simply keeps your approved assets
ready and you paste them, and you can submit URLs to Bing by hand.

---

## Your weekly distribution checklist

Do them in this order. Website first is deliberate, it is the highest-value step.

1. **Website**: publish the AI-search summary and FAQ onto the episode page, set the title,
   apply the internal links. Submit the page URL to Bing.
2. **YouTube**: paste the description, chapters, tags, and pinned comment.
3. **LinkedIn**: publish the article and the post.
4. **Medium**: publish the article, canonical link pointing to the client's site.
5. **Social**: schedule the X, Instagram, and Facebook posts across the week.
6. **Working material**: hand off clip ideas, quotes, the PDF outline.
7. **Dashboard**: update it and send it to the client so they see it all went live.

That is the full distribution. Once your website endpoint is connected, steps 1 and much of
5 happen on their own, and your weekly job shrinks to a few pastes and a review.
