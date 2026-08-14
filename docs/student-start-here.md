# AI Authority Engine — Start Here

This is the front door. Read this one page first, then follow the guide it points you to.

**What this is:** a system you run for your clients as a service. It takes a client's
podcast, and every week it transcribes the newest episode, writes a Brief plus 18 pieces of
content from it, waits for you to approve them, and helps you publish them across the web
where AI models (ChatGPT, Claude, Perplexity) actually look. Your client never touches it.
Your weekly job is a 15-minute review and a few pastes.

**The mental model:** the engine writes, you approve, you publish. That is the whole loop.

---

## What you need (this is the entire list)

**On your computer:**
- **Claude Code**, signed in. This is the only Claude tool you need. It runs everything for
  you, walks you through each step, and schedules the weekly automation itself.
- **Node** and **Git**, installed once. If you do not have them, Claude Code will check and
  help you install them at setup. You never think about them again.

**Two accounts you will get a key from (Claude Code guides you through both):**
- **OpenAI** — powers the transcription and the writing. You add a few dollars of credit.
- **Notion** — where all the content is stored and reviewed. The free plan works.

**What you do NOT need (on purpose):**
- No Make, Zapier, or n8n. No automation subscriptions of any kind.
- No MCP connectors or plugins to set up in Claude. The engine uses its own keys, not
  Claude connectors, so there is nothing to connect.
- No servers, no hosting, no other software.

That is it for the core system: Claude Code, two API keys, and a computer.

**Optional, later:** if you want publishing to be fully hands-off, you can wire each
platform's own API (guide 5). That is opt-in per platform and adds per-platform developer
accounts. You never need it to run the service, the paste pack always works, so ignore it
until you want it.

---

## The guides, in order

You will not need all of them at once. Start at the top.

1. **[Quick Start (the Claude Code way)](https://app.notion.com/p/3a7c03a4d9a581f8bc77fd2c72a4a439)**
   — Start here. Set the engine up for your first client by opening it in Claude Code and
   having a conversation. About 20 to 30 minutes, most of which is making the two accounts.

2. **[Setup SOP (manual, detailed)](https://app.notion.com/p/3a6c03a4d9a58129bc05c1f12929bda9)**
   — Only if you would rather do setup yourself, step by step, without leaning on Claude
   Code. Same result as the Quick Start, just more manual. Most people can skip this.

3. **[Running It Each Week](https://app.notion.com/p/3bbc03a4d9a58180b6d1f934b034c5d7)**
   — Your weekly routine once setup is done: see what is ready, review and approve in the
   client's voice, build the paste pack, publish, and update the client dashboard.

4. **[Distribution SOP](https://app.notion.com/p/3bcc03a4d9a58192aa56c7c9edf339fa)**
   — The detail behind the "publish" step: exactly where each of the 18 assets goes and how
   to post it. Read it once, then the weekly worksheet does the remembering for you.

5. **[Automated Publishing SOP (advanced, optional)](https://app.notion.com/p/3bcc03a4d9a581cdaa34f7ee260b99e3)**
   — For when you want publishing hands-off: wire each platform's own API so the engine
   posts for you. Opt-in per platform, with an honest account of what can and cannot be
   automated. Skip until you want it.

---

## The whole thing in one breath

Set it up once per client (guide 1). After that, every week: Claude Code has already
transcribed the new episode and written the content, so you open Notion, read and approve
what you like, say "build the paste pack," go down the one-page worksheet clicking Open,
Copy, paste, tick, and send the client their dashboard. Fifteen minutes, and your client
looks like they are everywhere AI is looking.
