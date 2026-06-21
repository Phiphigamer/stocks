"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Quote } from "@/lib/types";
import { CLAUDE_PORTFOLIO } from "@/lib/universe";
import { timeAgo } from "@/lib/format";
import { StockGrid } from "@/components/StockGrid";
import { SectorHeatmap } from "@/components/SectorHeatmap";

const SYMBOLS = CLAUDE_PORTFOLIO.map((l) => l.symbol).join(",");

const CATEGORIES = [
  {
    name: "Core Investors",
    description: "Companies with direct equity stakes in Anthropic",
    symbols: ["AMZN", "GOOGL", "CRM"],
  },
  {
    name: "AI Infrastructure",
    description: "Hardware and cloud platforms powering Claude",
    symbols: ["NVDA", "MSFT"],
  },
  {
    name: "Enterprise Partners",
    description: "SaaS platforms with deep Claude integrations",
    symbols: ["ADBE", "NOW", "SNOW", "DDOG", "ZM"],
  },
];

export default function ClaudePortfolio() {
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [asOf, setAsOf] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(SYMBOLS)}`, {
        cache: "no-store",
      });
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

  const allQuotes = CLAUDE_PORTFOLIO.flatMap((l) =>
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
              background: "linear-gradient(135deg, #c07ef0 0%, #7c3aed 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🤖
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Claude Portfolio</h1>
            <p style={{ margin: "4px 0 0" }}>
              Public equities that invest in, partner with, or directly benefit
              from Anthropic and the Claude AI platform.
            </p>
          </div>
        </div>

        <div
          className="panel"
          style={{
            marginTop: 20,
            padding: "14px 18px",
            borderLeft: "3px solid #7c3aed",
            background: "rgba(124,58,237,0.06)",
          }}
        >
          <strong>Note:</strong> Anthropic (Claude's maker) is a private company
          and not publicly traded. This portfolio tracks the <em>investable
          ecosystem</em> — the publicly listed companies with the deepest ties
          to Anthropic's growth: lead investors, cloud infrastructure providers,
          and enterprise software partners that embed Claude into their products.
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
          <div className="section-title">Ecosystem · today's move</div>
          <SectorHeatmap
            quotes={allQuotes}
            sectors={CATEGORIES.map((c) => ({ name: c.name, symbols: c.symbols }))}
          />

          {CATEGORIES.map((cat) => {
            const catQuotes = orderedQuotes(cat.symbols);
            return (
              <div key={cat.name}>
                <div className="section-title">
                  {cat.name}
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: "0.75rem",
                      color: "var(--muted)",
                      marginLeft: 10,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    {cat.description}
                  </span>
                </div>
                <StockGrid quotes={catQuotes} />
              </div>
            );
          })}
        </>
      )}

      <div className="footer">
        Market data via Yahoo Finance public endpoints, for informational
        purposes only and may be delayed. Portfolio composition reflects public
        reporting on Anthropic investment rounds and partner announcements — not
        financial advice. Anthropic is privately held and not included as a
        tradeable security.
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <div className="section-title">Ecosystem · today's move</div>
      <div className="stock-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 48 }} />
        ))}
      </div>
      <div className="section-title">Core Investors</div>
      <div className="stock-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 168 }} />
        ))}
      </div>
      <div className="section-title">AI Infrastructure</div>
      <div className="stock-grid">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 168 }} />
        ))}
      </div>
      <div className="section-title">Enterprise Partners</div>
      <div className="stock-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 168 }} />
        ))}
      </div>
    </>
  );
}
