"use client";

import { useEffect, useState, useCallback } from "react";
import type { Quote } from "@/lib/types";
import { PULSE, WATCHLIST } from "@/lib/universe";
import { timeAgo } from "@/lib/format";
import { MarketPulse } from "@/components/MarketPulse";
import { StockGrid } from "@/components/StockGrid";
import { SectorHeatmap } from "@/components/SectorHeatmap";

const PULSE_SET = new Set(PULSE.map((l) => l.symbol));
const WATCH_SET = new Set(WATCHLIST.map((l) => l.symbol));

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [asOf, setAsOf] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error("request failed");
      const json = await res.json();
      setQuotes(json.quotes);
      setAsOf(json.asOf ?? Date.now());
      setError(null);
    } catch {
      setError("Could not reach the market data service. Retrying…");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  const pulse = quotes?.filter((q) => PULSE_SET.has(q.symbol)) ?? [];
  // preserve the order defined in WATCHLIST
  const watch =
    quotes
      ?.filter((q) => WATCH_SET.has(q.symbol))
      .sort(
        (a, b) =>
          WATCHLIST.findIndex((l) => l.symbol === a.symbol) -
          WATCHLIST.findIndex((l) => l.symbol === b.symbol),
      ) ?? [];

  return (
    <div className="container">
      <div className="page-head">
        <h1>Global Tech Market Pulse</h1>
        <p>
          Live benchmarks, leading technology equities across US and
          international markets, and momentum across sub-sectors.
        </p>
        <div className="asof" style={{ marginTop: 8 }}>
          {asOf ? `Live · updated ${timeAgo(asOf)} · auto-refreshes every 60s` : "Loading live data…"}
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {!quotes ? (
        <LoadingState />
      ) : (
        <>
          <div className="section-title">Market Benchmarks</div>
          <MarketPulse quotes={pulse} />

          <div className="section-title">Sector Heatmap · today’s move</div>
          <SectorHeatmap quotes={watch} />

          <div className="section-title">Watchlist · global tech leaders</div>
          <StockGrid quotes={watch} />
        </>
      )}

      <Footer />
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="section-title">Market Benchmarks</div>
      <div className="pulse-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 96 }} />
        ))}
      </div>
      <div className="section-title">Watchlist</div>
      <div className="stock-grid">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 168 }} />
        ))}
      </div>
    </>
  );
}

function Footer() {
  return (
    <div className="footer">
      Market data via Yahoo Finance public endpoints, for informational purposes
      only and may be delayed. TechMarket Signals provides analytics and
      probabilistic, model-generated outlooks for educational use — it is not
      financial advice and not a recommendation to buy or sell any security.
    </div>
  );
}
