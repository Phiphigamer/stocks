import type { CSSProperties } from "react";
import type { Quote } from "@/lib/types";
import { SECTORS } from "@/lib/universe";
import { fmtPct, tone } from "@/lib/format";

function avgChange(symbols: string[], map: Record<string, Quote>): number | null {
  const vals = symbols
    .map((s) => map[s])
    .filter((q) => q && !q.error && isFinite(q.changePct))
    .map((q) => q.changePct);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function cellStyle(v: number | null): CSSProperties {
  if (v == null) return { background: "var(--bg-2)" };
  const mag = Math.min(Math.abs(v) / 3, 1); // saturate at ±3%
  const alpha = 0.08 + mag * 0.22;
  const rgb = v >= 0 ? "43, 212, 125" : "255, 90, 106";
  return {
    background: `rgba(${rgb}, ${alpha})`,
    borderColor: `rgba(${rgb}, ${0.25 + mag * 0.3})`,
  };
}

export function SectorHeatmap({ quotes }: { quotes: Quote[] }) {
  const map: Record<string, Quote> = Object.fromEntries(
    quotes.map((q) => [q.symbol, q]),
  );
  return (
    <div className="heatmap">
      {SECTORS.map((sector) => {
        const v = avgChange(sector.symbols, map);
        return (
          <div className="heat-cell" key={sector.name} style={cellStyle(v)}>
            <span className="h-name">{sector.name}</span>
            <span className={`h-val mono ${tone(v)}`}>{fmtPct(v)}</span>
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {sector.symbols.join(" · ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
