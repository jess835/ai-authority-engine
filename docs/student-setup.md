# AI Authority Engine — Student Setup SOP (Ingestion)

**What you are building in this SOP:** an automated system that watches your
podcast feed, and every time a new episode drops, it downloads the audio,
transcribes it into text you own, and files that transcript neatly into a Notion
database. No copy-pasting, no manual downloads, no "which tool can read YouTube"
headaches. This is the foundation. Everything else (turning one episode into 18
pieces of content) gets built on top of it later.

**Who this is for:** a student who is comfortable following steps carefully. You
do not need to know how to code. You do need to be willing to copy commands
exactly and read the screen. Budget about 45 to 60 minutes for your first setup.
You only do this setup once.

**What it costs to run:** roughly $18 a month in transcription for a weekly show,
plus a Notion plan (free tier works to start). We will note where the money goes.

---

## The big picture (read this first)

Here is the whole flow in plain English:

1. Your podcast has an **RSS feed**. That is a public web address that lists every
   episode and a direct link to each episode's audio file. Every podcast has one.
2. Our tool **checks that feed** on a schedule. When it sees an episode it has not
   processed yet, it grabs the audio link.
3. It **downloads the audio** and shrinks it (a 32 MB episode becomes about 12 MB)
   so it is small enough to transcribe in one go.
4. It sends the audio to **Whisper** (OpenAI's transcription service) and gets back
   an accurate, full-text transcript.
5. It **saves that transcript into Notion**, in a database, tagged with the episode
   title, date, and a status of "transcribed."

That is it. Detect, transcribe, store. Five steps, fully hands-off once it is set up.

> **Why this matters:** AI search tools (ChatGPT, Claude, Perplexity) only treat you
> as "the answer" when your ideas exist as text, in multiple places, that they can
> read. A transcript is the raw material for all of that. This system manufactures
> that raw material automatically, every week, without you lifting a finger.

---

## Part 1 — Get your accounts and keys ready

You need three things before you touch the code. Set these up first and keep the
keys somewhere safe (a note on your computer is fine for now). Treat these keys
like passwords. Never post them publicly or paste them into a chat.

### 1.1 An OpenAI API key (for transcription)

1. Go to **platform.openai.com** and sign up or log in.
2. Click your profile icon (top right) and choose **Billing**. Add a payment method
   and put a small amount of credit on the account (even $5 to start). Transcription
   is cheap, but the account needs credit or it will refuse to work.
3. In the left menu, open **API keys**, then click **Create new secret key**.
4. Copy the key (it starts with `sk-`). This is the only time it is shown. Save it.
   This is your `OPENAI_API_KEY`.

### 1.2 A Notion integration key (for storage)

Notion has a special kind of key called an "internal integration." It lets our tool
write to your Notion workspace.

1. Go to **notion.so/my-integrations**.
2. Click **New integration**. Give it a name like `AI Authority Engine`. Pick your
   workspace. Click **Save**.
3. On the next screen, copy the **Internal Integration Secret** (it starts with
   `ntn_` or `secret_`). Save it. This is your `NOTION_API_KEY`.

### 1.3 A Notion page for the tool to work inside

The tool needs one page in Notion to be its home. It will create its databases there.

1. In Notion, create a new blank page. Call it something like
   `AI Authority Engine — [Client Name]`.
2. On that page, click the **•••** menu (top right) → **Connections** →
   **Add connections** → choose the `AI Authority Engine` integration you just made.
   This step is what gives the tool permission to write to this page. If you skip it,
   you will get a "not found" error later.
3. Get the page's ID. Open the page, click **Share** → **Copy link**. The link looks
   like `https://www.notion.so/Some-Title-1234abcd5678ef90...`. The long string of
   letters and numbers at the end (before any `?`) is your `NOTION_PARENT_PAGE_ID`.
   Save it.

> Optional: an **AssemblyAI** key (assemblyai.com) acts as a backup transcriber for
> very long episodes. You can skip it to start. If you add it later, it is your
> `ASSEMBLYAI_API_KEY`.

---

## Part 2 — Install the two free tools your computer needs

You need **Node** (which runs the code) and **Git** (which downloads the code).

### On a Mac

1. Open the **Terminal** app (press Cmd+Space, type "Terminal", press Enter).
2. Install Node: go to **nodejs.org**, download the "LTS" version, and run the
   installer. Click through the defaults.
3. Git is usually already installed. To check, type `git --version` in Terminal and
   press Enter. If it asks to install developer tools, say yes.

### On Windows

1. Install Node: go to **nodejs.org**, download the "LTS" version, run the installer,
   click through the defaults.
2. Install Git: go to **git-scm.com/download/win**, run the installer, click through
   the defaults.
3. Open the **Command Prompt** app to run commands (press the Start key, type "cmd",
   press Enter).

To confirm both worked, type each of these and press Enter. You should see a version
number, not an error:

```
node --version
git --version
```

---

## Part 3 — Download the code and install it

Your coach will give you a **repository link** (a web address for the code) or a
**zip file**. Use whichever you were given.

**If you got a repository link:** in Terminal or Command Prompt, type this (replace
the link with the one you were given), pressing Enter after each line:

```
git clone <the-repository-link-you-were-given>
cd ai-authority-engine
npm install
```

**If you got a zip file:** unzip it, then in Terminal or Command Prompt navigate into
the folder and install. For example:

```
cd Downloads/ai-authority-engine
npm install
```

`npm install` downloads everything the tool needs, including the audio compressor. It
runs for a minute or two. When it finishes and returns you to a normal prompt, you are
done with this part.

---

## Part 4 — Plug in your keys

Inside the project folder there is a file called `.env.example`. You are going to
make a copy of it called `.env` and fill in your keys.

1. Make the copy. In Terminal or Command Prompt (make sure you are inside the project
   folder), run:
   - Mac: `cp .env.example .env`
   - Windows: `copy .env.example .env`
2. Open the new `.env` file in any text editor (TextEdit on Mac, Notepad on Windows).
3. Fill in the values you saved in Part 1. It should look like this, with your real
   keys after the `=` signs and no spaces or quotes:

```
OPENAI_API_KEY=sk-your-real-key-here
NOTION_API_KEY=ntn_your-real-key-here
NOTION_PARENT_PAGE_ID=your-page-id-here
PILOT_FEED_URL=
PILOT_CLIENT_NAME=Your Client Name
```

4. Leave `SOURCES_DB_ID` and `ASSETS_DB_ID` blank for now. You fill those in the next
   part. Save and close the file.

---

## Part 5 — Find your podcast's RSS feed

Every podcast has a public RSS feed, even if the host hides it. Here is the reliable
way to find it from an Apple Podcasts link.

1. Find your show on **podcasts.apple.com** and copy the page's web address. In it
   there is a number after `id`, for example `.../id1823417933`. Copy that number.
2. In your web browser's address bar, type this, replacing the number with yours, and
   press Enter:

   ```
   https://itunes.apple.com/lookup?id=1823417933
   ```
3. The page shows a block of text. Find the part that says `"feedUrl":` followed by a
   web address in quotes. That address is your RSS feed.
4. Copy that feed address into your `.env` file as the value of `PILOT_FEED_URL`. Save.

> If your show is only on Spotify or YouTube, the feed still usually exists through
> the original host (Anchor, Buzzsprout, Libsyn, and so on). Ask your coach if you get
> stuck, this is the one step where shows differ.

---

## Part 6 — Create your Notion databases

Now the tool builds the two databases it needs inside the page you shared in Part 1.
Run this command:

```
npm run setup:notion
```

If it works, it prints two lines that look like this:

```
SOURCES_DB_ID=abc123...
ASSETS_DB_ID=def456...
```

Copy those two lines into your `.env` file, replacing the blank `SOURCES_DB_ID=` and
`ASSETS_DB_ID=` lines. Save the file. If you get a "not found" error instead, you
almost certainly skipped step 1.3 part 2, go back and add the integration to the page.

Open Notion and confirm you now see two new databases on your page: one ending in
"Sources" and one ending in "Assets."

---

## Part 7 — Test it, then run it for real

### 7.1 Test detection (free, no transcription yet)

This just checks your feed and shows what is new. It does not cost anything.

```
npm run detect
```

You should see your latest episodes listed, with the newest marked `NEW`. If you see
your show's episodes, your feed is connected correctly.

### 7.2 Run the real thing

This detects the newest episode, transcribes it, and files it in Notion. It costs a
few cents in transcription.

```
npm run ingest
```

Watch the messages. It will say it is downloading, compressing, transcribing, then
creating a Notion row. When it finishes, open your Notion "Sources" database. You
should see a new row with the episode title, the date, a status of "transcribed," and
the full transcript inside the page. **That is the whole system working.**

To process more than the latest one (for example the last 3 episodes), run:

```
npm run ingest -- --latest 3
```

Running it again will not create duplicates. It skips anything already in Notion.

---

## Part 8 — Keep it running automatically

Right now the tool only runs when you type the command. For it to be truly hands-off,
it needs to run on a schedule on a computer that never sleeps.

**The simplest reliable option:** pick a computer that stays on (a desktop, a mini
Mac, or a cheap always-on server your coach recommends) and set the ingest command to
run every 30 minutes.

- On Mac or Linux you do this with a "cron job." Run `crontab -e` and add this line
  (put your real folder path in):

  ```
  */30 * * * * cd /full/path/to/ai-authority-engine && npm run ingest >> logs/cron.log 2>&1
  ```

- On Windows you use **Task Scheduler** to run `npm run ingest` in the project folder
  every 30 minutes.

> **Important:** a laptop that goes to sleep will miss the episode drop and you will
> not know. If you cannot dedicate an always-on machine, ask your coach about a small
> cloud server, which costs a few dollars a month and never sleeps.

---

## Part 9 — When something goes wrong

Every run writes to a log file at `logs/runs.jsonl` inside the project folder. If
something did not work, that file tells you what happened. Here are the common issues:

- **"Missing required env var ..."** — you did not fill in that value in `.env`, or you
  left a space or quotes around it. Open `.env` and check the line it names.
- **"not found" when creating databases** — the integration is not added to your Notion
  page. Redo step 1.3 part 2.
- **OpenAI error about billing or quota** — your OpenAI account has no credit. Add a few
  dollars in the Billing section.
- **"Audio download failed"** — the episode's audio link was temporarily unreachable.
  Run the command again in a few minutes.
- **Nothing happens / "Nothing new to ingest"** — you already processed the latest
  episode. That is correct behaviour. It will pick up the next new one automatically.

---

## Quick command reference

| Command | What it does | Costs money? |
| --- | --- | --- |
| `npm run detect` | Shows what is new in the feed | No |
| `npm run setup:notion` | Creates your Notion databases (run once) | No |
| `npm run ingest` | Transcribes the newest episode into Notion | A few cents |
| `npm run ingest -- --latest 3` | Does the newest 3 episodes | A few cents each |

---

## What you have accomplished

You now own an automated transcript machine. Every episode your show publishes becomes
a clean, searchable transcript in Notion without any manual work. This is the hardest
and most valuable part of the whole system, and it is done. In the next stage you will
learn to turn each of these transcripts into a content brief and 18 ready-to-publish
assets, all from the same source. But none of that works without this foundation, and
now you have it.
