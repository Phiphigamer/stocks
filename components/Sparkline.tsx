interface Props {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export function Sparkline({
  data,
  color,
  width = 120,
  height = 36,
  fill = true,
}: Props) {
  const clean = data.filter((d) => typeof d === "number" && isFinite(d));
  if (clean.length < 2) {
    return <svg width={width} height={height} />;
  }
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = clean.map((v, i) => {
    const x = pad + (i / (clean.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  const area =
    `M ${pad},${height - pad} ` +
    points.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L ${width - pad},${height - pad} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && (
        <>
          <defs>
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${areaId})`} />
        </>
      )}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
