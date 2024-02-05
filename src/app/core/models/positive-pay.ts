export type ExceptionReason = 'amount-mismatch' | 'payee-mismatch' | 'serial-not-issued'
  | 'duplicate-serial' | 'stale-dated' | 'no-issue-file';
export type ExceptionDecision = 'pay' | 'return' | undefined;

export interface PositivePayException {
  exceptionId: string;
  accountId: string;
  accountNickname: string;
  checkSerial: string;
  presentedAmountMinor: number;
  issuedAmountMinor: number | null;
  presentedPayee: string;
  issuedPayee: string | null;
  presentedAt: string;
  /** Decisions after this instant default to return. 14:00 ET for the treasury book. */
  decisionCutoffAt: string;
  reason: ExceptionReason;
  decision: ExceptionDecision;
  decidedBy?: string;
  decidedAt?: string;
  imageAvailable: boolean;
}

export interface ExceptionDecisionRequest {
  exceptionIds: string[];
  decision: 'pay' | 'return';
  note?: string;
}
