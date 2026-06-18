// Lightweight technical signals computed from a daily close series.
// Pure functions — safe to import on the client.

export interface Signal {
  label: string;
  value: string;
  tone: "pos" | "neg" | "flat";
  hint: string;
}

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computeSignals(closes: number[]): Signal[] {
  const valid = closes.filter((c) => typeof c === "number" && isFinite(c));
  const signals: Signal[] = [];
  const last = valid[valid.length - 1];

  // Momentum: price vs 50-day moving average.
  const ma50 = sma(valid, 50);
  if (ma50 && last) {
    const gap = ((last - ma50) / ma50) * 100;
    signals.push({
      label: "Momentum",
      value: `${gap > 0 ? "+" : ""}${gap.toFixed(1)}% vs 50d MA`,
      tone: gap > 1 ? "pos" : gap < -1 ? "neg" : "flat",
      hint:
        gap > 1
          ? "Trading above its 50-day average — bullish momentum"
          : gap < -1
            ? "Trading below its 50-day average — bearish momentum"
            : "Hovering around its 50-day average",
    });
  }

  // Trend: last close vs ~20 sessions ago.
  if (valid.length >= 21) {
    const prior = valid[valid.length - 21];
    const change = ((last - prior) / prior) * 100;
    signals.push({
      label: "1-Month Trend",
      value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
      tone: change > 0 ? "pos" : change < 0 ? "neg" : "flat",
      hint: change > 0 ? "Up over the past month" : "Down over the past month",
    });
  }

  // Volatility: annualized stdev of daily returns over last ~30 sessions.
  if (valid.length >= 21) {
    const window = valid.slice(-30);
    const returns: number[] = [];
    for (let i = 1; i < window.length; i++) {
      returns.push((window[i] - window[i - 1]) / window[i - 1]);
    }
    const annualized = stdev(returns) * Math.sqrt(252) * 100;
    signals.push({
      label: "Volatility",
      value: `${annualized.toFixed(0)}% ann.`,
      tone: annualized > 50 ? "neg" : annualized < 25 ? "pos" : "flat",
      hint:
        annualized > 50
          ? "Elevated price swings — higher risk"
          : annualized < 25
            ? "Relatively calm price action"
            : "Moderate volatility",
    });
  }

  // RSI: relative strength index (overbought / oversold).
  const r = rsi(valid);
  if (r != null) {
    signals.push({
      label: "RSI (14)",
      value: r.toFixed(0),
      tone: r > 70 ? "neg" : r < 30 ? "pos" : "flat",
      hint:
        r > 70
          ? "Overbought — may be due for a pullback"
          : r < 30
            ? "Oversold — may be due for a bounce"
            : "Neither overbought nor oversold",
    });
  }

  return signals;
}
