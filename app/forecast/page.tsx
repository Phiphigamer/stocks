"use client";

import { useState } from "react";
import type { Forecast } from "@/lib/types";
import { Disclaimer } from "@/components/Disclaimer";

const EXAMPLES = [
  { label: "NVDA outlook", ticker: "NVDA", query: "Where is NVDA likely headed over the next two quarters?" },
  { label: "Semiconductor sector", ticker: "", query: "What's the outlook for the global semiconductor sector this year?" },
  { label: "AAPL vs MSFT", ticker: "AAPL", query: "How does Apple's risk/reward compare to Microsoft right now?" },
  { label: "ASML", ticker: "ASML", query: "What are the key drivers and risks for ASML?" },
];

const ORDER: Record<string, number> = { Bear: 0, Base: 1, Bull: 2 };

interface Result {
  forecast: Forecast;
  model: string;
  dataAsOf: number | null;
  context: string | null;
}

export default function ForecastPage() {
  const [ticker, setTicker] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    if (!ticker.trim() && !query.trim()) {
      setError("Enter a ticker or a question to generate a forecast.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: ticker.trim(), query: query.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(json);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function useExample(e: (typeof EXAMPLES)[number]) {
    setTicker(e.ticker);
    setQuery(e.query);
  }

  const scenarios = result
    ? [...result.forecast.scenarios].sort(
        (a, b) => (ORDER[a.name] ?? 9) - (ORDER[b.name] ?? 9),
      )
    : [];

  return (
    <div className="container">
      <div className="page-head">
        <h1>AI Forecast Engine</h1>
        <p>
          Ask about a ticker or a theme. The engine grounds its answer in live
          price data (when a ticker is given) and returns a calibrated,
          scenario-based outlook — never a single guaranteed number.
        </p>
      </div>

      <div className="panel forecast-form" style={{ marginTop: 16 }}>
        <div className="field-row">
          <input
            className="input ticker"
            placeholder="TICKER"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && run()}
            aria-label="Ticker symbol"
          />
          <input
            className="input"
            placeholder="Ask a question, e.g. “Where is NVDA headed by Q4?”"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            aria-label="Question"
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="chips">
            {EXAMPLES.map((e) => (
              <button key={e.label} className="chip" onClick={() => useExample(e)} type="button">
                {e.label}
              </button>
            ))}
          </div>
          <button className="btn" onClick={run} disabled={loading} type="button">
            {loading ? (
              <>
                <span className="spinner" /> &nbsp;Analyzing…
              </>
            ) : (
              "Generate forecast"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {loading && <LoadingForecast />}

      {result && (
        <div style={{ marginTop: 22 }}>
          <div style={{ marginBottom: 14 }}>
            <Disclaimer compact />
          </div>

          <div className="panel" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div className="section-title" style={{ margin: 0 }}>
                  Outlook {ticker && `· ${ticker}`}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 16, lineHeight: 1.55, maxWidth: 720 }}>
                  {result.forecast.summary}
                </p>
              </div>
              <ConfidenceBadge
                level={result.forecast.confidence}
                rationale={result.forecast.confidenceRationale}
                horizon={result.forecast.timeHorizon}
              />
            </div>
          </div>

          <div className="section-title">Scenarios</div>
          <div className="scenario-grid">
            {scenarios.map((s) => (
              <div key={s.name} className={`scenario ${s.name.toLowerCase()}`}>
                <div className="s-head">
                  <span className="s-name">{s.name} case</span>
                  <span className="s-prob">{Math.round(s.probability)}%</span>
                </div>
                <div className="s-target">
                  {fmtTarget(s.targetLow, s.targetHigh)}
                </div>
                <div className="s-rationale">{s.rationale}</div>
              </div>
            ))}
          </div>

          <div className="two-col" style={{ marginTop: 14 }}>
            <div className="panel" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginTop: 0 }}>
                Key Drivers
              </div>
              <ul className="kv-list">
                {result.forecast.drivers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="panel" style={{ padding: 20 }}>
              <div className="section-title" style={{ marginTop: 0 }}>
                Key Risks
              </div>
              <ul className="kv-list risks">
                {result.forecast.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="asof" style={{ marginTop: 14 }}>
            Generated by {result.model}
            {result.dataAsOf ? " · grounded in live price data" : " · sector/theme-level (no ticker data)"}
          </div>
        </div>
      )}

      {!result && !loading && (
        <div style={{ marginTop: 22 }}>
          <Disclaimer />
        </div>
      )}
    </div>
  );
}

function fmtTarget(lo: number, hi: number): string {
  const f = (n: number) =>
    Math.abs(n) >= 1000
      ? n.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (lo === hi) return f(lo);
  return `${f(lo)} – ${f(hi)}`;
}

function ConfidenceBadge({
  level,
  rationale,
  horizon,
}: {
  level: string;
  rationale: string;
  horizon: string;
}) {
  const tone =
    level === "High" ? "pos" : level === "Low" ? "neg" : "flat";
  return (
    <div style={{ textAlign: "right", maxWidth: 280 }}>
      <span className={`badge ${tone}`} style={{ fontSize: 12 }}>
        {level} confidence
      </span>
      <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>
        {horizon}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 6, lineHeight: 1.45 }}>
        {rationale}
      </div>
    </div>
  );
}

function LoadingForecast() {
  return (
    <div style={{ marginTop: 22 }}>
      <div className="skeleton" style={{ height: 110, marginBottom: 14 }} />
      <div className="scenario-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 150 }} />
        ))}
      </div>
    </div>
  );
}
