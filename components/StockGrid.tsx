import Link from "next/link";
import type { Quote } from "@/lib/types";
import { fmtPrice, fmtPct, tone } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { sparkColor } from "./colors";

function rangePct(q: Quote): number | null {
  if (
    q.fiftyTwoWeekHigh == null ||
    q.fiftyTwoWeekLow == null ||
    q.fiftyTwoWeekHigh === q.fiftyTwoWeekLow
  )
    return null;
  const p = ((q.price - q.fiftyTwoWeekLow) /
    (q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow)) *
    100;
  return Math.max(0, Math.min(100, p));
}

function StockCard({ q }: { q: Quote }) {
  const rp = rangePct(q);
  return (
    <Link href={`/stock/${encodeURIComponent(q.symbol)}`} className="panel stock-card">
      <div className="sc-top">
        <div>
          <div className="sc-sym">{q.symbol}</div>
          <div className="sc-name">{q.name}</div>
        </div>
        <div className="sc-price mono">
          {q.error ? "—" : fmtPrice(q.price, q.currency)}
        </div>
      </div>

      <div className="sc-mid">
        <div className="sc-deltas">
          <div className="sc-delta">
            <span className="k">Today</span>
            <span className={`v mono ${tone(q.changePct)}`}>
              {q.error ? "—" : fmtPct(q.changePct)}
            </span>
          </div>
          <div className="sc-delta">
            <span className="k">1 Month</span>
            <span className={`v mono ${tone(q.monthChangePct)}`}>
              {fmtPct(q.monthChangePct)}
            </span>
          </div>
        </div>
        <div className="sc-spark">
          <Sparkline data={q.spark} color={sparkColor(q.monthChangePct)} width={120} height={36} />
        </div>
      </div>

      {rp != null && (
        <div className="range-bar">
          <div className="range-track">
            <div className="range-fill" style={{ width: `${rp}%` }} />
            <div className="range-dot" style={{ left: `${rp}%` }} />
          </div>
          <div className="range-labels">
            <span>{fmtPrice(q.fiftyTwoWeekLow, q.currency)}</span>
            <span>52-week range</span>
            <span>{fmtPrice(q.fiftyTwoWeekHigh, q.currency)}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

export function StockGrid({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="stock-grid">
      {quotes.map((q) => (
        <StockCard key={q.symbol} q={q} />
      ))}
    </div>
  );
}
