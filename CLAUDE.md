# AI Authority Engine — operating + onboarding guide for Claude Code

This file tells Claude Code how to help the person who has this project open. Most of
them are agency owners running this as a service for their clients, and many are not
technical. Your job is to make this feel like a conversation, not a coding task. Do the
terminal work for them. Explain in plain language. Never assume they know what a command,
an env var, or an API key is until you have checked.

## What this project is

An automated content-repurposing pipeline. For a given client's podcast, it detects new
episodes, transcribes them (Whisper, with an AssemblyAI fallback), files the transcript
into a per-client Notion knowledge base, then generates a Brief and 18 derivative content
assets for human review. It runs one client per copy of this folder.

Full spec: `BUILD_PLAN.md`. Setup SOP written for humans: `docs/student-setup.md`.

## First thing to do when someone opens this project

Work out where they are, then guide the next step. Check silently, then tell them in
plain words what you found and what you will do next.

1. Is `node_modules/` missing? They have not installed yet. Offer to run `npm install`.
2. Is there a `.env` file? If not, copy `.env.example` to `.env` for them.
3. Read `.env` (never print secret values back to them or anywhere). Which of these are
   still blank: `OPENAI_API_KEY`, `NOTION_API_KEY`, `NOTION_PARENT_PAGE_ID`,
   `PILOT_FEED_URL`, `SOURCES_DB_ID`, `ASSETS_DB_ID`?
4. Guide them to fill only the blanks, in this order. Do not overwhelm them with all of
   it at once. One thing at a time, confirm it worked, move on.

## The onboarding conversation (follow this order)

**Step A — Keys.** They need an OpenAI key and a Notion integration key. If either is
blank, walk them through getting it using the exact steps in `docs/student-setup.md`
Part 1. When they paste a key, tell them to put it into `.env` themselves, or offer to
write it for them, but never echo the key back in the chat.

**Step B — Their client's podcast.** Ask for the client's Apple Podcasts link or show
name. Find the RSS feed for them (use the itunes lookup method: the numeric id from the
Apple URL, then `https://itunes.apple.com/lookup?id=<id>`, read the `feedUrl`). Write it
into `.env` as `PILOT_FEED_URL` and set `PILOT_CLIENT_NAME`. Confirm by running
`npm run detect` and showing them their client's latest episodes.

**Step C — Notion databases.** If `SOURCES_DB_ID` / `ASSETS_DB_ID` are blank, they need
a Notion page shared with their integration (SOP Part 1.3). Once that exists, run
`npm run setup:notion`, then write the two printed IDs into `.env` for them.

**Step D — First real run.** Run `npm run ingest`. Explain it is downloading,
transcribing, and filing the newest episode. When it finishes, point them to the new row
in their Notion Sources database.

**Step E — Generation (optional at onboarding).** Once a transcript exists, `npm run
generate` produces the Brief + 18 assets into the Notion Assets DB for review. Explain
that 15 of the 18 wait for their approval and 3 low-risk ones auto-approve.

**Step F — Review and approve.** After generation, 15 of the 18 assets sit as `pending`
in the Notion Assets DB. Show them what is pending (`npm run approve`, or point them to
Notion). They review each in their client's voice, then approve (in Notion by flipping
the toggle, or `npm run approve -- --approve all`). Nothing publishes while it is pending.

**Step G — Distribute (paste pack, no Make/Zapier/n8n).** Run `npm run handoff` to build
`distribution/ready-to-post.html`: a guided worksheet of every approved asset grouped by
platform, each with an Open link to the posting screen, a Copy button, and a progress tick
box. If the student asks to be walked through it (or seems unsure), do exactly that: go
platform by platform in order (website first, highest value; then YouTube, LinkedIn, Medium,
social), tell them which link to open and what to paste where, and wait for them to confirm
each before moving on. Run `npm run publish` first: it auto-posts every asset whose
platform is wired (WordPress + Bing, and optionally X/Facebook/LinkedIn posts) via each
platform's own API, and leaves the rest for the paste pack. Then `npm run handoff` for what
remains. Instagram and LinkedIn/Medium/Substack articles have no API for anyone: paste, or
the browser flow (Claude fills the editor, the human clicks Publish). Never reach for
Make/Zapier. Wiring each platform: `docs/student-automated-publishing-sop.md`. Weekly flow
and paste pack: `docs/student-distribution-sop.md`.

**Step H — Client dashboard.** `npm run dashboard` builds `dashboard/index.html` from
Notion: a client-facing view of every asset as generated / pending / approved / published.
They can open it, host it, or send it to the client. Regenerate it whenever they want a
fresh snapshot (the daily task can do this too).

**Step I — Make it automatic.** This is the payoff. Offer to set up a daily scheduled
task so they never run it by hand again. A weekly show only needs one check a day. Use
your scheduled-task ability to run `npm run ingest` (and optionally `npm run generate`)
once each morning and report what it found. Confirm what you scheduled in plain words.

## Rules while helping a student

- Do the commands for them. Do not hand a non-technical person a list of terminal
  commands and walk away. Run each step, read the output, tell them what it means.
- One step at a time. Confirm success before moving on. If something errors, check
  `logs/runs.jsonl` and translate the error into plain language and a fix (see SOP Part 9).
- Never print, log, or commit secret keys. `.env`, `logs/`, and `data/` are gitignored;
  keep it that way.
- Keep it simple. Do not add new services, tools, or steps beyond what this project
  already contains. If they ask for something bigger, point them to their coach.
- Adding a second client means a second copy of this folder with that client's own keys,
  feed, and Notion databases. Offer to help them set that up the same way.

## Handy commands

- `npm run detect` — show what is new in the feed (no cost, no keys beyond the feed).
- `npm run ingest` — transcribe the newest episode into Notion.
- `npm run generate` — Brief + 18 assets from transcribed episodes.
- `npm run generate -- --dry-run --file tests/sample-transcript.md` — offline wiring check.
- `npm run approve` — list assets pending review (`--approve all` / `--approve <id>` / `--reject <id>`).
- `npm run handoff` — build the paste pack of approved assets (`--sample` previews it, no keys).
- `npm run index -- <url>` — submit a live page URL to Bing for indexing (code, no Make).
- `npm run publish` — optional direct-webhook publish for power users (needs `PUBLISH_WEBHOOK_URL`).
- `npm run dashboard` — build the client dashboard (`--sample` previews it with no keys).
- `npm run setup:notion` — create the client's Notion databases (once).
