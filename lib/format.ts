export function fmtPrice(n: number | null | undefined, currency = "USD"): string {
  if (n == null || !isFinite(n)) return "—";
  const digits = Math.abs(n) >= 1000 ? 2 : Math.abs(n) >= 1 ? 2 : 4;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function fmtNumber(n: number | null | undefined, digits = 2): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

export function tone(n: number | null | undefined): "pos" | "neg" | "flat" {
  if (n == null || !isFinite(n) || n === 0) return "flat";
  return n > 0 ? "pos" : "neg";
}

export function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}
