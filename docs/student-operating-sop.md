# AI Authority Engine — Running It Each Week (Review, Approve, Publish)

This SOP is what you do *after* setup. If you have not set the engine up for your client
yet, do that first with the Quick Start (the Claude Code way). Once it is running, this is
the short weekly routine that turns each new episode into published content your client
gets credit for.

**Who this is for:** you, the agency owner, running this as a service. Your client never
touches any of it. Your whole job each week is a review and a click.

**How long it takes:** about 15 to 20 minutes per client, per episode. That is the entire
service delivery.

---

## What happens without you

Once the daily scan is on, most of the work is already done before you sit down:

1. Your client publishes a new episode.
2. The engine notices it (daily scan), transcribes it, and files it in Notion.
3. It writes a Brief and 18 content assets from that transcript.
4. Those assets land in your Notion Assets database. 15 of them are marked **pending**,
   waiting for you. 3 low-risk ones (tags and two SEO helpers) are pre-approved.

So when you open Notion, the content is already written. You are not creating, you are
approving. That is the whole point.

---

## The one rule that keeps it all straight

Every asset has a **status**, and it can only move forward one step at a time:

**generated → pending → approved → published**

Nothing publishes while it is pending. Publishing only ever touches what you approved. So
you can never accidentally push something live before you have read it. Your approval is
the wall between "drafted" and "public."

---

## Step 1 — See what is ready

Open Claude Code in your client's project folder and say:

> "Show me what's pending for review."

It lists every asset waiting on you (the LinkedIn article, the Medium article, the social
posts, the FAQ, and so on). You can also just open the Assets database in Notion and look
at the ones marked pending. Either works.

---

## Step 2 — Review and approve, in your client's voice

This is the part that makes it a real service instead of spam. Go through each pending
asset and read it as if you were the client.

For each one:

- **Read it.** Does it sound like your client? Is every claim something they actually
  said in the episode?
- **Edit if needed.** The text lives right there in Notion. Change any wording, tighten a
  hook, fix a name. Small edits are normal and expected.
- **Approve it.** In Notion, change its Approval Status from `pending` to `approved`. Or
  tell Claude Code "approve the ones I've checked" or "approve them all."
- **Or reject it.** If an asset misses, set it to `rejected` and it will not go out. You
  can ask Claude Code to regenerate that one.

Do not rush this. The whole promise to your client is that this content is on-brand and
accurate. Ten quiet minutes of reading is the service.

> Tip: start with the big-visibility pieces (the two articles and the social posts). The
> SEO helpers and the FAQ usually need only a glance.

---

## Step 3 — Publish the approved assets

When you are happy with your approved pile, tell Claude Code:

> "Publish the approved assets."

Only the approved ones go out. Each one is sent to its destination and then marked
`published`, with a link to where it went. Any new web page is also submitted to Bing so
it gets indexed where AI answer engines look.

Distribution is the messiest part of the whole system, because every platform plays by
different rules (some post automatically, some you paste by hand). Where each of the 18
assets goes, and exactly how to get it there, is its own short guide:
**see the Distribution SOP (`docs/student-distribution-sop.md`).** The one rule to
remember here: website first, every week, because the transcript, AI-search summary, and
FAQ living on the client's own site is what AI engines actually cite.

---

## Step 4 — Update the client dashboard and share it

This is what makes the client feel the service. Tell Claude Code:

> "Update the dashboard."

It builds a clean, single-page dashboard from Notion showing every asset for every episode
and its status: generated, pending, approved, published. Send your client the link, or
drop it in their portal. They open it and see, at a glance, that their one podcast episode
became a stack of published content across the web. That visible proof is what renews the
retainer.

---

## Your weekly rhythm

Once you have done it once, the whole thing is a short loop per client:

1. Open the project, ask Claude Code what is pending.
2. Read and approve (edit anything that needs it).
3. Say "publish the approved assets."
4. Say "update the dashboard" and send it to the client.

That is the service. Fifteen minutes, and your client looks like they are everywhere.

---

## If something looks stuck

Tell Claude Code what you see, in plain words. Because every asset carries a status, a
stuck one is easy to spot and explain:

- **An episode has no assets yet** — it was transcribed but generation has not run. Ask
  Claude Code to "generate the content for the latest episode."
- **Assets are stuck on pending** — that is just waiting on you. Review and approve them.
- **Approved assets did not publish** — your publishing endpoint is probably not connected
  yet. Ask Claude Code to check, or post those pieces manually for now.

Claude Code keeps a log of every run and can read it, so you almost never have to figure
anything out alone.

---

## What you are really delivering

You are not selling "content." You are selling presence. Every week, your client's ideas
go from a single audio file trapped in one app to transcripts and content spread across
the properties that ChatGPT, Claude, and Perplexity actually read. You review, you approve,
you publish, and the dashboard shows the receipts. That is the service, and now you can run
it in fifteen minutes a week.
