"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Quote } from "@/lib/types";
import { TECH_PORTFOLIO, TECH_SECTORS } from "@/lib/universe";
import { timeAgo } from "@/lib/format";
import { StockGrid } from "@/components/StockGrid";
import { SectorHeatmap } from "@/components/SectorHeatmap";

const SYMBOLS = TECH_PORTFOLIO.map((l) => l.symbol).join(",");

const CATEGORIES = [
  {
    name: "Semiconductors",
    symbols: ["NVDA", "AMD", "AVGO", "TSM", "ASML", "INTC", "QCOM", "AMAT"],
  },
  {
    name: "Cloud & Hyperscalers",
    symbols: ["MSFT", "AMZN", "GOOGL", "ORCL"],
  },
  {
    name: "Software & SaaS",
    symbols: ["ADBE", "CRM", "NOW", "SNOW"],
  },
  {
    name: "Consumer Tech & Platforms",
    symbols: ["AAPL", "META", "NFLX", "SPOT"],
  },
  {
    name: "Cybersecurity",
    symbols: ["CRWD", "PANW", "FTNT", "S"],
  },
  {
    name: "AI & Data Infrastructure",
    symbols: ["DDOG", "MDB", "PLTR", "GTLB"],
  },
];

export default function TechPortfolio() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [asOf, setAsOf] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/quotes?symbols=${encodeURIComponent(SYMBOLS)}`,
        { cache: "no-store" },
      );
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

  const quoteMap = new Map(quotes?.map((q) => [q.symbol, q]) ?? []);

  const orderedQuotes = (symbols: string[]): Quote[] =>
    symbols.flatMap((s) => (quoteMap.has(s) ? [quoteMap.get(s)!] : []));

  const allQuotes = TECH_PORTFOLIO.flatMap((l) =>
    quoteMap.has(l.symbol) ? [quoteMap.get(l.symbol)!] : [],
  );

  return (
    <div className="container">
      <div style={{ paddingTop: 28 }}>
        <Link href="/" className="back-link">
          ← Back to dashboard
        </Link>
      </div>

      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            💻
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Technology Sector Portfolio</h1>
            <p style={{ margin: "4px 0 0" }}>
              28 leading technology equities spanning semiconductors, cloud,
              software, cybersecurity, consumer tech, and AI infrastructure.
            </p>
          </div>
        </div>

        <div className="asof" style={{ marginTop: 12 }}>
          {asOf
            ? `Live · updated ${timeAgo(asOf)} · auto-refreshes every 60s`
            : "Loading live data…"}
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
          <div className="section-title">Sub-sector heatmap · today's move</div>
          <SectorHeatmap quotes={allQuotes} sectors={TECH_SECTORS} />

          {CATEGORIES.map((cat) => (
            <div key={cat.name}>
              <div className="section-title">{cat.name}</div>
              <StockGrid quotes={orderedQuotes(cat.symbols)} />
            </div>
          ))}
        </>
      )}

      <div className="footer">
        Market data via Yahoo Finance public endpoints, for informational
        purposes only and may be delayed. TechMarket Signals provides
        analytics for educational use — not financial advice and not a
        recommendation to buy or sell any security.
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="section-title">Sub-sector heatmap · today's move</div>
      <div className="stock-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 48 }} />
        ))}
      </div>
      {CATEGORIES.map((cat) => (
        <div key={cat.name}>
          <div className="section-title">{cat.name}</div>
          <div className="stock-grid">
            {Array.from({ length: cat.symbols.length }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 168 }} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
