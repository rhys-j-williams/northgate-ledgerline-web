/** Shape of GET /v1/fx/rates on the TickerHaus vendor API (and the mock on 4602). */
export interface FxQuote {
  pair: string;
  base: string;
  quote: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: string;
  source: string;
}

export interface FxRatesResponse {
  rates: FxQuote[];
  asOf: string;
}

export interface FxPairsResponse {
  pairs: string[];
}
