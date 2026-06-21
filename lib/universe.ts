export interface Listing {
  symbol: string;
  name: string;
}

// Top "market pulse" bar — broad tech benchmarks.
export const PULSE: Listing[] = [
  { symbol: "^NDX", name: "Nasdaq 100" },
  { symbol: "XLK", name: "US Tech Sector" },
  { symbol: "SOXX", name: "Semiconductors" },
  { symbol: "IXN", name: "Global Tech" },
];

// Watchlist spanning US mega-caps and international technology leaders.
export const WATCHLIST: Listing[] = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "TSM", name: "TSMC · Taiwan" },
  { symbol: "ASML", name: "ASML · Netherlands" },
  { symbol: "SAP", name: "SAP · Germany" },
  { symbol: "BABA", name: "Alibaba · China" },
  { symbol: "TCEHY", name: "Tencent · China" },
  { symbol: "005930.KS", name: "Samsung · Korea" },
];

// Sub-sector groupings for the heatmap (averaged from watchlist constituents).
export const SECTORS: { name: string; symbols: string[] }[] = [
  { name: "Semiconductors", symbols: ["NVDA", "AMD", "AVGO", "TSM", "ASML"] },
  { name: "Software", symbols: ["MSFT", "SAP"] },
  { name: "Cloud & Internet", symbols: ["AMZN", "GOOGL", "META", "BABA", "TCEHY"] },
  { name: "Hardware", symbols: ["AAPL", "005930.KS"] },
  { name: "AI Infrastructure", symbols: ["NVDA", "AVGO", "AMD"] },
  { name: "Mobility & EV", symbols: ["TSLA"] },
];

// Claude Portfolio — public equities that invest in, partner with, or directly
// benefit from Anthropic and the Claude AI platform.
export const CLAUDE_PORTFOLIO: Listing[] = [
  { symbol: "AMZN",  name: "Amazon · Lead Investor & AWS Bedrock Host" },
  { symbol: "GOOGL", name: "Alphabet · Major Investor & GCP Partner" },
  { symbol: "NVDA",  name: "NVIDIA · GPU Infrastructure for Claude" },
  { symbol: "CRM",   name: "Salesforce · Investor & Claude Integrations" },
  { symbol: "ADBE",  name: "Adobe · Claude-Powered Creative AI" },
  { symbol: "NOW",   name: "ServiceNow · Claude Enterprise Workflows" },
  { symbol: "SNOW",  name: "Snowflake · Claude Data Intelligence" },
  { symbol: "DDOG",  name: "Datadog · Claude Observability Stack" },
  { symbol: "ZM",    name: "Zoom · Claude AI Companion" },
  { symbol: "MSFT",  name: "Microsoft · Azure AI Infrastructure" },
];

export const ALL_LISTINGS: Listing[] = [...PULSE, ...WATCHLIST];
export const ALL_SYMBOLS: string[] = ALL_LISTINGS.map((l) => l.symbol);

export const NAME_MAP: Record<string, string> = Object.fromEntries(
  ALL_LISTINGS.map((l) => [l.symbol, l.name]),
);

export function nameFor(symbol: string): string {
  return NAME_MAP[symbol] ?? symbol;
}
