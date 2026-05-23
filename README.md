# Coqtale

Mobile-first cocktail menu scanner and recommender. Installable PWA for iPhone.

## Local setup

```bash
npm install
```

Create a `.env` file (never commit it):
```
ANTHROPIC_API_KEY=your_key_here
TURSO_DATABASE_URL=your_turso_url_here
TURSO_AUTH_TOKEN=your_turso_token_here
```

Run locally (Vite dev server only — API functions require Vercel CLI):
```bash
npm run dev
```

To run with API functions locally:
```bash
npm install -g vercel
vercel dev
```

## Deploy

1. Connect the GitHub repo to Vercel
2. Add the three env vars in Vercel project settings
3. Push to `main` — Vercel builds automatically

## Run DB migration (once after first deploy)

```
GET https://your-app.vercel.app/api/migrate
```

In production, add `MIGRATE_SECRET` to env vars and pass it as `x-migrate-secret` header.

## Stack

- React + Vite + PWA
- Vercel (hosting + serverless API)
- Turso (SQLite, always-on free tier)
- Claude API (vision + recommendations)
