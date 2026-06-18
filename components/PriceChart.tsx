"use client";

import { useMemo, useRef, useState, type MouseEvent } from "react";
import type { ChartPoint } from "@/lib/types";
import { fmtPrice } from "@/lib/format";
import { POS, NEG } from "./colors";

interface Props {
  points: ChartPoint[];
  currency: string;
  range: string;
  baseline?: number | null; // previous close, drawn as a dashed reference
}

const W = 1000;
const H = 320;
const PAD = { top: 16, right: 8, bottom: 22, left: 8 };

export function PriceChart({ points, currency, range, baseline }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const clean = useMemo(
    () => points.filter((p) => isFinite(p.c)),
    [points],
  );

  const geom = useMemo(() => {
    if (clean.length < 2) return null;
    const ys = clean.map((p) => p.c);
    let min = Math.min(...ys);
    let max = Math.max(...ys);
    if (baseline != null && isFinite(baseline)) {
      min = Math.min(min, baseline);
      max = Math.max(max, baseline);
    }
    const spread = max - min || 1;
    min -= spread * 0.06;
    max += spread * 0.06;
    const span = max - min;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const xAt = (i: number) =>
      PAD.left + (i / (clean.length - 1)) * innerW;
    const yAt = (v: number) =>
      PAD.top + innerH - ((v - min) / span) * innerH;

    const coords = clean.map((p, i) => [xAt(i), yAt(p.c)] as const);
    const line = coords
      .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ");
    const area =
      `M ${coords[0][0].toFixed(2)} ${(H - PAD.bottom).toFixed(2)} ` +
      coords.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") +
      ` L ${coords[coords.length - 1][0].toFixed(2)} ${(H - PAD.bottom).toFixed(2)} Z`;

    return { coords, line, area, yAt, xAt };
  }, [clean, baseline]);

  if (!geom) {
    return (
      <div className="panel" style={{ height: 320, display: "grid", placeItems: "center", color: "var(--text-faint)" }}>
        No chart data available.
      </div>
    );
  }

  const up = clean[clean.length - 1].c >= clean[0].c;
  const color = up ? POS : NEG;
  const gid = "pcgrad";

  function onMove(e: MouseEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const frac = (x - PAD.left) / (W - PAD.left - PAD.right);
    const idx = Math.round(frac * (clean.length - 1));
    setHover(Math.max(0, Math.min(clean.length - 1, idx)));
  }

  const hoverPt = hover != null ? clean[hover] : null;
  const hoverXY = hover != null ? geom.coords[hover] : null;

  const baseY =
    baseline != null && isFinite(baseline) ? geom.yAt(baseline) : null;

  return (
    <div style={{ position: "relative" }} className="panel" >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="320"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {baseY != null && (
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={baseY}
            y2={baseY}
            stroke="var(--text-faint)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}

        <path d={geom.area} fill={`url(#${gid})`} />
        <path
          d={geom.line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {hoverXY && (
          <>
            <line
              x1={hoverXY[0]}
              x2={hoverXY[0]}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--text-faint)"
              strokeWidth="1"
              opacity="0.5"
            />
            <circle cx={hoverXY[0]} cy={hoverXY[1]} r="4" fill={color} stroke="var(--bg-2)" strokeWidth="2" />
          </>
        )}
      </svg>

      {hoverPt && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left:
              hover != null && hover > clean.length / 2 ? undefined : 12,
            right:
              hover != null && hover > clean.length / 2 ? 12 : undefined,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 12px",
            pointerEvents: "none",
          }}
        >
          <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
            {fmtPrice(hoverPt.c, currency)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
            {formatStamp(hoverPt.t, range)}
          </div>
        </div>
      )}
    </div>
  );
}

function formatStamp(epochSecs: number, range: string): string {
  const d = new Date(epochSecs * 1000);
  if (range === "1D" || range === "1W") {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
