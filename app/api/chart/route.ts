import { NextResponse } from "next/server";
import { fetchChart, toPoints } from "@/lib/yahoo";
import { nameFor } from "@/lib/universe";
import type { ChartResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map a UI range label to Yahoo's range + interval pair.
const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").trim();
  const rangeLabel = searchParams.get("range") ?? "1M";
  const conf = RANGE_MAP[rangeLabel] ?? RANGE_MAP["1M"];

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const { meta, timestamps, closes } = await fetchChart(
      symbol,
      conf.range,
      conf.interval,
    );
    const last = closes[closes.length - 1];
    const body: ChartResponse = {
      symbol,
      name: nameFor(symbol),
      currency: meta.currency ?? "USD",
      range: rangeLabel,
      points: toPoints(timestamps, closes),
      meta: {
        price: meta.regularMarketPrice ?? last,
        previousClose:
          meta.previousClose ?? meta.chartPreviousClose ?? closes[0] ?? last,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
        volume: meta.regularMarketVolume ?? null,
      },
    };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Could not load chart data for " + symbol, symbol },
      { status: 502 },
    );
  }
}
