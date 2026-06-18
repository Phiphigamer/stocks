// Server-only helpers for Yahoo Finance's public (keyless) endpoints.
import type { Quote, ChartPoint } from "./types";
import { nameFor } from "./universe";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const BASES = [
  "https://query1.finance.yahoo.com",
  "https://query2.finance.yahoo.com",
];

interface ChartMeta {
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}

interface ChartResult {
  meta: ChartMeta;
  timestamps: number[];
  closes: number[];
}

async function fetchJson(path: string): Promise<any> {
  let lastErr: unknown = null;
  for (const base of BASES) {
    try {
      const res = await fetch(base + path, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

export async function fetchChart(
  symbol: string,
  range: string,
  interval: string,
): Promise<ChartResult> {
  const path = `/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${range}&interval=${interval}&includePrePost=false`;
  const json = await fetchJson(path);
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("no chart data");

  const meta: ChartMeta = result.meta ?? {};
  const rawTs: number[] = result.timestamp ?? [];
  const rawClose: (number | null)[] =
    result.indicators?.quote?.[0]?.close ?? [];

  const timestamps: number[] = [];
  const closes: number[] = [];
  for (let i = 0; i < rawTs.length; i++) {
    const c = rawClose[i];
    if (typeof c === "number" && isFinite(c)) {
      timestamps.push(rawTs[i]);
      closes.push(c);
    }
  }
  return { meta, timestamps, closes };
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  try {
    const { meta, closes } = await fetchChart(symbol, "1mo", "1d");
    const last = closes[closes.length - 1];
    const price = meta.regularMarketPrice ?? last;
    const previousClose =
      meta.previousClose ??
      closes[closes.length - 2] ??
      meta.chartPreviousClose ??
      price;
    const change = price - previousClose;
    const changePct = previousClose ? (change / previousClose) * 100 : 0;

    const first = closes[0];
    const monthChangePct =
      first && first !== 0 ? ((price - first) / first) * 100 : null;

    return {
      symbol,
      name: nameFor(symbol),
      currency: meta.currency ?? "USD",
      price,
      previousClose,
      change,
      changePct,
      monthChangePct,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      marketCap: null,
      trailingPE: null,
      spark: closes,
    };
  } catch {
    return {
      symbol,
      name: nameFor(symbol),
      currency: "USD",
      price: NaN,
      previousClose: NaN,
      change: NaN,
      changePct: NaN,
      monthChangePct: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      dayHigh: null,
      dayLow: null,
      volume: null,
      marketCap: null,
      trailingPE: null,
      spark: [],
      error: true,
    };
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  return Promise.all(symbols.map((s) => fetchQuote(s)));
}

// ---- Best-effort fundamentals (market cap, P/E) via the crumb-gated v7 quote
// endpoint. Fully guarded: any failure simply yields null values. ----

let crumbCache: { crumb: string; cookie: string; ts: number } | null = null;

async function getCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  if (crumbCache && Date.now() - crumbCache.ts < 30 * 60 * 1000) {
    return crumbCache;
  }
  try {
    const r1 = await fetch("https://fc.yahoo.com/", {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(4000),
    });
    const rawCookie = r1.headers.get("set-cookie") ?? "";
    const cookie = rawCookie.split(";")[0];
    if (!cookie) return null;

    const r2 = await fetch(
      "https://query1.finance.yahoo.com/v1/test/getcrumb",
      { headers: { "User-Agent": UA, Cookie: cookie }, signal: AbortSignal.timeout(4000) },
    );
    const crumb = (await r2.text()).trim();
    if (!crumb || crumb.includes("<") || crumb.length > 24) return null;

    crumbCache = { crumb, cookie, ts: Date.now() };
    return crumbCache;
  } catch {
    return null;
  }
}

export async function fetchFundamentals(
  symbols: string[],
): Promise<Record<string, { marketCap: number | null; trailingPE: number | null }>> {
  const out: Record<string, { marketCap: number | null; trailingPE: number | null }> = {};
  try {
    const c = await getCrumb();
    if (!c) return out;
    const url =
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=` +
      encodeURIComponent(symbols.join(",")) +
      `&crumb=${encodeURIComponent(c.crumb)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Cookie: c.cookie },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return out;
    const json = await res.json();
    const rows: any[] = json?.quoteResponse?.result ?? [];
    for (const row of rows) {
      if (row?.symbol) {
        out[row.symbol] = {
          marketCap: typeof row.marketCap === "number" ? row.marketCap : null,
          trailingPE:
            typeof row.trailingPE === "number" ? row.trailingPE : null,
        };
      }
    }
  } catch {
    /* ignore — fundamentals are optional */
  }
  return out;
}

export function toPoints(timestamps: number[], closes: number[]): ChartPoint[] {
  return timestamps.map((t, i) => ({ t, c: closes[i] }));
}
