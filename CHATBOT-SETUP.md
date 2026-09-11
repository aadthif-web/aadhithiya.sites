# AI Chat Assistant — Setup Guide

Your site now has a floating "Ask about Aadhithiya" chat bubble (bottom-right)
backed by the real Claude API. It answers questions about your skills,
projects, certificates, and contact info using the facts baked into
`api/chat.js`.

Because it's AI-powered, it needs a tiny backend to hold your API key —
a browser can never be trusted with a secret key. `api/chat.js` is that
backend: a serverless function that runs on Vercel for free.

## 1. Get an Anthropic API key
1. Go to https://console.anthropic.com and sign in / sign up.
2. Create an API key under **Settings → API Keys**.
3. (Recommended) Set a monthly spend limit under **Settings → Billing** so
   costs can't run away if the bot gets heavy traffic.

## 2. Push this project to GitHub
Keep this folder structure exactly as-is:
```
index.html
api/chat.js
package.json
.gitignore
```
Create a new GitHub repo and push these files. Do **not** commit an `.env`
file with your real key — `.gitignore` already excludes it.

## 3. Deploy on Vercel (free tier is plenty)
1. Go to https://vercel.com/new and import your GitHub repo.
2. Vercel auto-detects the static `index.html` + `/api` function — no build
   config needed.
3. Before deploying, add an environment variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** the key from step 1
4. Click **Deploy**. Your site (and the chat bot) is now live.

Prefer Netlify or Cloudflare Pages instead? The same idea applies — put
`chat.js` in `netlify/functions/` or as a Cloudflare Pages Function, adjust
the `module.exports` handler signature to match their format, and set the
same `ANTHROPIC_API_KEY` environment variable in their dashboard.

## 4. Test locally (optional)
```bash
npm i -g vercel
vercel dev
```
Create a local `.env` file (gitignored) with:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Then open the local URL Vercel prints and try the chat bubble.

## Keeping it accurate
All the facts the bot uses live in the `SYSTEM_PROMPT` string at the top of
`api/chat.js`. When you add a new project, certificate, or skill to your
site, update that same text so the bot stays in sync.

## Cost & abuse notes
- Each reply is capped at 400 tokens and conversation history sent per
  request is capped at 12 messages, so a single conversation stays cheap.
- For a personal portfolio, traffic is usually low enough that this needs
  no extra rate limiting. If the site starts getting heavy traffic and you
  want harder limits, add IP-based rate limiting via Vercel's Edge Config or
  a service like Upstash Redis.
