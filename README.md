# Mise

Boston restaurant opening copilot — built for the Claude Builder Club Spring 2026 Hackathon at MIT.

A web app that helps first-time independent restaurant operators (especially immigrant entrepreneurs) navigate Boston's permits, licenses, and inspections. The user fills out a short questionnaire, Claude generates 3-5 adaptive follow-up questions, and Mise produces (a) a phased roadmap and (b) a prep sheet for their next critical bureaucratic interaction — all in their chosen language with key English terms preserved.

## Stack

- HTML + Tailwind CSS (CDN) + vanilla JS frontend
- Vercel serverless functions (`api/`) calling the Anthropic SDK
- Model: `claude-opus-4-7`
- No database, no auth, no persistence

## Local dev

```
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

Vercel is still useful for deployment, but local development no longer depends on a Vercel login.

## Deploy

Push to GitHub. Vercel auto-deploys. Set `ANTHROPIC_API_KEY` in the Vercel project settings.

## Project structure

```
mise/
├── api/
│   ├── followups.js       # Initial answers → adaptive follow-ups
│   └── generate.js        # All answers → roadmap + prep sheet
├── public/
│   ├── index.html         # Single-page app, 3 screens
│   └── app.js             # State machine + fetch
├── corpus/
│   └── boston-restaurants.md   # Domain knowledge (system-prompt corpus)
├── package.json
├── vercel.json
```
