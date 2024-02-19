export type AuditCategory = 'payments' | 'entitlements' | 'positive-pay' | 'session' | 'system';
export type AuditOutcome = 'success' | 'denied' | 'failure';

export interface AuditEvent {
  eventId: string;
  occurredAt: string;
  category: AuditCategory;
  action: string;
  actor: string;
  /** Entitlement role the actor held at the time. */
  actorRole: string;
  subjectType: string;
  subjectId: string;
  outcome: AuditOutcome;
  correlationId: string;
  sourceIp: string;
  detail?: string;
}

export interface AuditQuery {
  from?: string;
  to?: string;
  categories?: AuditCategory[];
  actor?: string;
  text?: string;
}

export interface AuditPage {
  events: AuditEvent[];
  total: number;
}
