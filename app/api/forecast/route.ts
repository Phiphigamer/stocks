import { NextResponse } from "next/server";
import { fetchQuote } from "@/lib/yahoo";
import { fmtPrice, fmtPct } from "@/lib/format";
import type { Forecast } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM = `You are the forecasting engine for "TechMarket Signals", a quantitative research tool focused on global technology markets.

You produce probabilistic, scenario-based outlooks — NEVER a single guaranteed prediction. You are intellectually honest about uncertainty: markets are not precisely predictable, and you say so through calibrated probabilities and clearly-bounded target ranges.

When live price data for a security is provided, ground your numbers in it (current price, recent change, 52-week range). When no specific security is identified, give a sector- or theme-level outlook.

Respond with ONLY a single valid JSON object (no markdown, no code fences, no prose before or after) matching exactly this shape:
{
  "summary": string,                 // 2-3 sentence neutral outlook
  "timeHorizon": string,             // e.g. "Next 1-2 quarters", "Through end of 2026"
  "confidence": "Low" | "Medium" | "High",
  "confidenceRationale": string,     // one sentence explaining the confidence level
  "scenarios": [                     // exactly three: Bear, Base, Bull
    {
      "name": "Bear" | "Base" | "Bull",
      "probability": number,         // integer percent; the three MUST sum to 100
      "targetLow": number,           // lower bound of the price/level target for this scenario
      "targetHigh": number,          // upper bound
      "rationale": string            // one sentence
    }
  ],
  "drivers": string[],               // 3-5 key catalysts / drivers
  "risks": string[]                  // 3-5 key risks
}

Rules:
- The three scenario probabilities must sum to exactly 100.
- Targets should be plausible relative to the current price when provided.
- Keep every string concise and free of hype. No investment advice or "you should buy/sell" language.`;

interface CacheEntry {
  ts: number;
  data: { forecast: Forecast; model: string; dataAsOf: number | null; context: string | null };
}
const cache = new Map<string, CacheEntry>();
const TTL = 5 * 60 * 1000;

function stripToJson(text: string): string {
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return t.slice(start, end + 1);
  }
  return t;
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        error:
          "The forecast engine is not configured. Add a GROQ_API_KEY environment variable and redeploy.",
      },
      { status: 503 },
    );
  }

  let query = "";
  let symbol = "";
  try {
    const body = await req.json();
    query = (body.query ?? "").toString().slice(0, 600);
    symbol = (body.symbol ?? "").toString().trim().slice(0, 16);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!query && !symbol) {
    return NextResponse.json(
      { error: "Enter a ticker or a question." },
      { status: 400 },
    );
  }

  const cacheKey = `${symbol}::${query}`.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    return NextResponse.json({ ...hit.data, cached: true });
  }

  let context: string | null = null;
  let dataAsOf: number | null = null;
  if (symbol) {
    const q = await fetchQuote(symbol);
    if (!q.error) {
      dataAsOf = Date.now();
      context = [
        `Live market data for ${q.symbol} (${q.name}), currency ${q.currency}:`,
        `- Current price: ${fmtPrice(q.price, q.currency)}`,
        `- Daily change: ${fmtPct(q.changePct)}`,
        q.monthChangePct != null
          ? `- 1-month change: ${fmtPct(q.monthChangePct)}`
          : "",
        q.fiftyTwoWeekLow != null && q.fiftyTwoWeekHigh != null
          ? `- 52-week range: ${fmtPrice(q.fiftyTwoWeekLow, q.currency)} – ${fmtPrice(q.fiftyTwoWeekHigh, q.currency)}`
          : "",
        q.marketCap != null ? `- Market cap: ${q.marketCap}` : "",
        q.trailingPE != null ? `- Trailing P/E: ${q.trailingPE.toFixed(1)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  const userContent = [
    context ? context + "\n" : "",
    symbol ? `The user is asking about ticker: ${symbol}.\n` : "",
    query ? `User question: ${query}` : `Provide an outlook for ${symbol}.`,
  ].join("");

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
      }),
      signal: AbortSignal.timeout(55000),
    });

    if (!res.ok) {
      const message =
        res.status === 401
          ? "The GROQ_API_KEY is invalid or missing permissions."
          : res.status === 429
            ? "Rate limited by Groq. Please wait a moment and try again."
            : "The forecast engine hit an error. Please try again.";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";

    let forecast: Forecast;
    try {
      forecast = JSON.parse(stripToJson(text));
    } catch {
      return NextResponse.json(
        { error: "The model returned an unexpected format. Please try again." },
        { status: 502 },
      );
    }

    const data = { forecast, model: "Llama 3.3 70B (Groq)", dataAsOf, context };
    cache.set(cacheKey, { ts: Date.now(), data });
    return NextResponse.json({ ...data, cached: false });
  } catch {
    return NextResponse.json(
      { error: "The forecast engine hit an error. Please try again." },
      { status: 500 },
    );
  }
}
