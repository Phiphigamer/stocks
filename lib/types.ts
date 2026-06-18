export interface Quote {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  changePct: number;
  monthChangePct: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  spark: number[];
  error?: boolean;
}

export interface ChartPoint {
  t: number; // epoch seconds
  c: number; // close
}

export interface ChartResponse {
  symbol: string;
  name: string;
  currency: string;
  range: string;
  points: ChartPoint[];
  meta: {
    price: number;
    previousClose: number;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    volume: number | null;
  };
  error?: boolean;
}

export interface Scenario {
  name: "Bear" | "Base" | "Bull" | string;
  probability: number; // 0-100
  targetLow: number;
  targetHigh: number;
  rationale: string;
}

export interface Forecast {
  summary: string;
  timeHorizon: string;
  confidence: "Low" | "Medium" | "High" | string;
  confidenceRationale: string;
  scenarios: Scenario[];
  drivers: string[];
  risks: string[];
}
