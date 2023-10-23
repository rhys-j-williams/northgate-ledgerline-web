export type PaymentRail = 'wire' | 'ach' | 'rtp' | 'book-transfer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'released';
export type ApprovalUrgency = 'standard' | 'same-day' | 'cutoff-at-risk';

export interface PaymentApproval {
  approvalId: string;
  paymentId: string;
  organisationId: string;
  rail: PaymentRail;
  /** Minor units, USD unless `currency` says otherwise. */
  amountMinor: number;
  currency: string;
  debitAccountId: string;
  debitAccountNickname: string;
  beneficiaryName: string;
  beneficiaryAccountLastFour: string;
  beneficiaryRoutingNumber: string;
  initiatedBy: string;
  initiatedAt: string;
  valueDate: string;
  cutoffAt: string;
  status: ApprovalStatus;
  urgency: ApprovalUrgency;
  /** Number of approvals still required. Dual approval is the treasury default. */
  approvalsRequired: number;
  approvalsGiven: string[];
  memo?: string;
  /** Present when the BFF's fraud screen flagged the payment. */
  riskFlags: string[];
}

export interface ApprovalDecision {
  approvalId: string;
  decision: 'approve' | 'reject';
  reason?: string;
}

export interface ApprovalDecisionResult {
  approvalId: string;
  status: ApprovalStatus;
  approvalsGiven: string[];
  decidedAt: string;
}
