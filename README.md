# AI Authority Engine

Automated content-repurposing pipeline. When a client publishes new content, the
system detects it, transcribes it, files it in a per-client Notion knowledge base,
generates a Brief + 18 derivative assets, routes them through human approval, and
distributes the approved ones across the properties AI models favour.

Built in TypeScript/Node, one language across the whole repo. Each external
dependency (transcription, LLM, publishing) sits behind one swappable interface.

## Status

**Week 1 — Ingestion: built and proven.**

- [x] Content detection (podcast/blog RSS poll) — live against the pilot feed
- [x] Transcript module: audio download -> compress -> Whisper, AssemblyAI fallback, automatic failover
- [x] Audio prep proven: today's real 31.8 MB episode compresses to 11.9 MB (one Whisper call, no chunking, no Homebrew)
- [x] Per-client Notion data model (Sources + Assets DBs, section 5 schema)
- [x] Run logging to `logs/runs.jsonl` (no silent missed triggers)
- [ ] Full live run (detect -> Whisper -> Notion) — needs API keys, see Setup

Pilot client: **E-Forge With Cory Long** (`https://anchor.fm/s/106844750/podcast/rss`),
weekly, drops Thursday.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `OPENAI_API_KEY` — Whisper transcription
   - `NOTION_API_KEY` — a Notion **internal integration** secret ([create one](https://www.notion.so/my-integrations))
   - `NOTION_PARENT_PAGE_ID` — a Notion page ID; open the page, ... menu -> Connections -> add your integration
   - `ASSEMBLYAI_API_KEY` — optional fallback for very long audio
3. `npm run setup:notion` — creates the per-client Sources + Assets databases, prints their IDs
4. Paste the printed `SOURCES_DB_ID` and `ASSETS_DB_ID` into `.env`

## Commands

```bash
npm run detect                 # poll the feed, show what's new (no keys needed)
npm run probe -- <audio-url>   # download + compress an audio URL, report sizes (no keys needed)
npm run setup:notion           # one-time: create the client's Notion databases
npm run ingest                 # newest unprocessed episode -> transcribe -> Notion
npm run ingest -- --latest 3   # newest 3 unprocessed episodes
npm run ingest -- --feed <url> # a different feed
```

Ingestion is idempotent: an episode already in Notion is skipped on re-runs.

## Always-on (production)

Scheduled triggers need a host that never sleeps. Run `npm run ingest` on a cron
(every ~30 min) on a small always-on VPS, or a scheduled GitHub Action. A laptop
that sleeps will silently miss the Thursday drop.

Example cron (every 30 minutes):
```
*/30 * * * * cd /path/to/ai-authority-engine && /usr/bin/npm run ingest >> logs/cron.log 2>&1
```

## Layout

```
src/lib/        config, logger, audio prep, transcription, notion  (swappable interfaces)
src/ingest/     rss detection + the Week 1 ingest runner
scripts/        setup-notion (create DBs), probe-audio (diagnostic)
prompts/        Brief + 18 asset templates          (Week 2)
src/generate/   Brief + asset generation            (Week 2)
src/distribute/ publishers per platform             (Week 3)
dashboard/      client-facing view                  (Week 3)
```

Build one week at a time. Week 2 (generation) does not start until Week 1 runs
hands-off on the pilot.
