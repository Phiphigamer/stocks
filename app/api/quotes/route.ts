import { NextResponse } from "next/server";
import { fetchQuotes, fetchFundamentals } from "@/lib/yahoo";
import { ALL_SYMBOLS } from "@/lib/universe";
import type { Quote } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple warm-instance cache to soften upstream rate limits.
let cache: { ts: number; key: string; quotes: Quote[] } | null = null;
const TTL = 30 * 1000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("symbols");
  const symbols = raw
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : ALL_SYMBOLS;
  const key = symbols.join(",");

  if (cache && cache.key === key && Date.now() - cache.ts < TTL) {
    return NextResponse.json({ quotes: cache.quotes, asOf: cache.ts, cached: true });
  }

  const quotes = await fetchQuotes(symbols);

  // Enrich with fundamentals where possible (best-effort, never blocks).
  try {
    const funds = await fetchFundamentals(symbols);
    for (const q of quotes) {
      const f = funds[q.symbol];
      if (f) {
        q.marketCap = f.marketCap;
        q.trailingPE = f.trailingPE;
      }
    }
  } catch {
    /* fundamentals are optional */
  }

  cache = { ts: Date.now(), key, quotes };
  return NextResponse.json({ quotes, asOf: cache.ts, cached: false });
}
