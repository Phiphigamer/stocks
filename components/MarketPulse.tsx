import type { Quote } from "@/lib/types";
import { fmtNumber, fmtPct, tone } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { sparkColor } from "./colors";

export function MarketPulse({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="pulse-grid">
      {quotes.map((q) => (
        <div className="panel pulse-card" key={q.symbol}>
          <span className="label">{q.name}</span>
          <span className="value mono">
            {q.error ? "—" : fmtNumber(q.price, 2)}
          </span>
          <span className={`delta ${tone(q.changePct)}`}>
            {q.error ? "data unavailable" : fmtPct(q.changePct)}
          </span>
          <div className="pulse-spark">
            <Sparkline
              data={q.spark}
              color={sparkColor(q.changePct)}
              width={92}
              height={40}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
