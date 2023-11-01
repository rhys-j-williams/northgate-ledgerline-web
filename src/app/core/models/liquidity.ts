export type PositionBucket = 'operating' | 'concentration' | 'reserve' | 'investment';

export interface LiquidityPosition {
  accountId: string;
  nickname: string;
  accountNumberMasked: string;
  bucket: PositionBucket;
  currency: string;
  ledgerBalanceMinor: number;
  availableBalanceMinor: number;
  /** Intraday movement since the opening ledger, minor units. */
  intradayNetMinor: number;
  /** Sweep target the concentration engine works to, if configured. */
  targetBalanceMinor: number | null;
  asOf: string;
}

export interface CashForecastPoint {
  date: string;
  projectedMinor: number;
  confirmedMinor: number;
}

export interface LiquiditySnapshot {
  organisationId: string;
  asOf: string;
  positions: LiquidityPosition[];
  forecast: CashForecastPoint[];
}
