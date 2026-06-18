# TechMarket Signals

A global **technology market analytics dashboard** combined with an **AI forecast engine**, built with Next.js (App Router) and designed to deploy to **Vercel** with zero configuration.

- 📊 **Live dashboard** — benchmarks (Nasdaq‑100, US Tech, Semiconductors, Global Tech), a watchlist of US and international tech leaders, a sector heatmap, interactive price charts, and quant signals.
- 🤖 **AI forecast engine** — ask about a ticker or a theme and get a calibrated, **scenario‑based** outlook (bear / base / bull with probabilities and target ranges), grounded in live price data.
- 🧭 **Intellectually honest** — every forecast is framed as probabilities and scenarios, with a persistent “not financial advice” disclaimer. No tool can predict markets precisely, and this one doesn’t pretend to.

Market data comes from Yahoo Finance’s **public, keyless** endpoints (proxied through serverless API routes to avoid CORS). The only secret you need is an **Anthropic API key** for the forecast engine.

---

## 1. Run it locally

Requires **Node.js 18.18+** (or 20+).

```bash
cd techmarket-signals
npm install

# create your env file and add your Anthropic key
cp .env.example .env.local
#   then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

npm run dev
```

Open http://localhost:3000.

> The dashboard works without any key. Only the **AI Forecast** tab needs `ANTHROPIC_API_KEY`.

---

## 2. Deploy to Vercel (live URL)

**Option A — via GitHub (recommended):**

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** the repo. Vercel auto‑detects Next.js — no build settings needed.
3. In **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com/)
4. Click **Deploy**. You’ll get a live `*.vercel.app` URL.

**Option B — via the Vercel CLI:**

```bash
npm i -g vercel
vercel            # follow the prompts to link/create the project
vercel env add ANTHROPIC_API_KEY   # paste your key (Production + Preview)
vercel --prod     # deploy to your live URL
```

> **Netlify** also works: it supports Next.js out of the box. Set the same `ANTHROPIC_API_KEY` env var in Site settings.

---

## 3. Configuration & tuning

| What | Where |
| --- | --- |
| Model used for forecasts | `app/api/forecast/route.ts` → `MODEL`. Defaults to `claude-opus-4-8` (most capable). Switch to `claude-sonnet-4-6` for lower cost/latency. |
| Watchlist / benchmarks / sectors | `lib/universe.ts` |
| Forecast cache window | `app/api/forecast/route.ts` → `TTL` (default 5 min per query) |
| Dashboard refresh interval | `app/page.tsx` (default 60s) |

### Notes & limits

- **Market cap / P/E** are fetched best‑effort from Yahoo and may show `—` if Yahoo throttles that endpoint. Prices, % changes, 52‑week ranges, volume, charts, and signals all use the reliable keyless chart endpoint.
- On Vercel’s **Hobby** plan, serverless functions may cap at ~10s. The forecast route is configured for up to 60s (`maxDuration`); if forecasts time out on Hobby, either keep `claude-sonnet-4-6` (faster) or upgrade the plan.
- International tickers report in their local currency (e.g. Samsung `005930.KS` in KRW); each card/label shows the currency.

---

## Project structure

```
app/
  page.tsx                 Dashboard (live benchmarks, watchlist, heatmap)
  forecast/page.tsx        AI forecast engine UI
  stock/[symbol]/page.tsx  Per-ticker detail: chart, stats, quant signals
  api/quotes/route.ts      Quotes proxy (Yahoo, keyless) + fundamentals
  api/chart/route.ts       Price-series proxy (1D…1Y)
  api/forecast/route.ts    Claude-powered scenario forecast
components/                Charts, cards, heatmap, nav, disclaimer
lib/                       Data fetching, types, formatting, signals
```

---

**Disclaimer:** TechMarket Signals is for **educational and informational purposes only**. It is **not financial advice** and **not** a recommendation to buy or sell any security. Market data may be delayed. Forecasts are probabilistic, model‑generated estimates.
