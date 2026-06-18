"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Quote, ChartResponse } from "@/lib/types";
import { fmtPrice, fmtPct, fmtCompact, tone } from "@/lib/format";
import { computeSignals } from "@/lib/signals";
import { PriceChart } from "@/components/PriceChart";

const RANGES = ["1D", "1W", "1M", "6M", "1Y"];

export default function StockDetail() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(
    Array.isArray(params.symbol) ? params.symbol[0] : params.symbol,
  );

  const [quote, setQuote] = useState<Quote | null>(null);
  const [range, setRange] = useState("1M");
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [signalCloses, setSignalCloses] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Quote + 1Y daily series (for signals) — fetched once.
  useEffect(() => {
    (async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          fetch(`/api/quotes?symbols=${encodeURIComponent(symbol)}`, { cache: "no-store" }),
          fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=1Y`, { cache: "no-store" }),
        ]);
        const qJson = await qRes.json();
        setQuote(qJson.quotes?.[0] ?? null);
        if (sRes.ok) {
          const sJson: ChartResponse = await sRes.json();
          setSignalCloses(sJson.points.map((p) => p.c));
        }
      } catch {
        setError("Could not load data for this symbol.");
      }
    })();
  }, [symbol]);

  const loadChart = useCallback(async (r: string) => {
    setChartLoading(true);
    try {
      const res = await fetch(
        `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${r}`,
        { cache: "no-store" },
      );
      if (res.ok) setChart(await res.json());
    } catch {
      /* ignore */
    } finally {
      setChartLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadChart(range);
  }, [range, loadChart]);

  const signals = signalCloses.length > 30 ? computeSignals(signalCloses) : [];
  const currency = quote?.currency ?? "USD";

  return (
    <div className="container">
      <div style={{ paddingTop: 28 }}>
        <Link href="/" className="back-link">
          ← Back to dashboard
        </Link>
      </div>

      {error && (
        <div className="error-banner" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div className="detail-head">
          <div>
            <h1 style={{ marginBottom: 2 }}>{symbol}</h1>
            <p style={{ margin: 0 }}>{quote?.name ?? ""}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="detail-price">
              {quote ? fmtPrice(quote.price, currency) : "—"}
            </div>
            {quote && (
              <div className={tone(quote.changePct)} style={{ fontWeight: 600 }}>
                {fmtPrice(quote.change, currency)} ({fmtPct(quote.changePct)}) today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Range tabs + chart */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "18px 0 12px" }}>
        <div className="range-tabs">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`btn-ghost ${range === r ? "active" : ""}`}
              onClick={() => setRange(r)}
              type="button"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {chart && !chartLoading ? (
        <PriceChart
          points={chart.points}
          currency={currency}
          range={range}
          baseline={chart.meta.previousClose}
        />
      ) : (
        <div className="skeleton" style={{ height: 320 }} />
      )}

      {/* Stats */}
      {quote && (
        <div className="stat-row">
          <Stat k="Prev Close" v={fmtPrice(quote.previousClose, currency)} />
          <Stat k="52-Week High" v={fmtPrice(quote.fiftyTwoWeekHigh, currency)} />
          <Stat k="52-Week Low" v={fmtPrice(quote.fiftyTwoWeekLow, currency)} />
          <Stat k="Volume" v={fmtCompact(quote.volume)} />
          <Stat k="Day High" v={fmtPrice(quote.dayHigh, currency)} />
          <Stat k="Day Low" v={fmtPrice(quote.dayLow, currency)} />
          <Stat k="Market Cap" v={fmtCompact(quote.marketCap)} />
          <Stat k="Trailing P/E" v={quote.trailingPE != null ? quote.trailingPE.toFixed(1) : "—"} />
        </div>
      )}

      {/* Signals */}
      <div className="section-title">Quant Signals</div>
      {signals.length ? (
        <div className="signal-grid">
          {signals.map((s) => (
            <div className="signal" key={s.label}>
              <div className="s-label">{s.label}</div>
              <div className={`s-value ${s.tone}`}>{s.value}</div>
              <div className="s-hint">{s.hint}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="signal-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 92 }} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div style={{ margin: "26px 0 10px" }}>
        <Link href="/forecast" className="btn" style={{ display: "inline-block" }}>
          Run an AI forecast →
        </Link>
      </div>

      <div className="footer">
        Data via Yahoo Finance public endpoints; may be delayed. Signals are
        derived technical indicators for informational purposes only — not
        financial advice.
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
