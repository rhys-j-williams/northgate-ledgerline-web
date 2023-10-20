import {
  Account, Customer, Entitlement, generateFixtures, maskAccountNumber, PAYEE_NAMES, SeededRandom,
  TEST_ROUTING_NUMBER
} from '@meridian/domain-fixtures';
import {
  AuditCategory, AuditEvent, AuditOutcome, CashForecastPoint, ExceptionReason, LiquidityPosition,
  PaymentApproval, PaymentRail, PositionBucket, PositivePayException, TreasurySession
} from '../models';

/**
 * Treasury slice of the shared fixtures plus the entities domain-fixtures does not model yet
 * (payments awaiting approval, positive pay exceptions, audit trail). Everything is derived from
 * the same seeded stream so a given seed always produces the same screens. Ask platform-services
 * before adding shapes here; anything the BFF will eventually own belongs in domain-fixtures
 * (PLAT-1902 tracks moving approvals over).
 *
 * The clock is fixed to `asOf` so cutoffs and "due in" labels do not drift under a screenshot.
 */
export interface TreasuryDataset {
  asOf: Date;
  organisation: Customer;
  accounts: Account[];
  entitlements: Entitlement[];
  session: TreasurySession;
  approvals: PaymentApproval[];
  positions: LiquidityPosition[];
  forecast: CashForecastPoint[];
  exceptions: PositivePayException[];
  audit: AuditEvent[];
}

const RAILS: PaymentRail[] = ['wire', 'wire', 'ach', 'ach', 'ach', 'rtp', 'book-transfer'];
const BENEFICIARIES = [
  ...PAYEE_NAMES.filter(name => !name.startsWith('Meridian')),
  'Northgate Logistics LLC', 'Sable & Rourke Legal', 'Tiverton Packaging Co', 'Pinecrest Facilities Mgmt'
];
const MEMOS = ['Q3 vendor settlement', 'Payroll funding', 'Lease - Denver site', 'Tax deposit',
  'Intercompany sweep', 'Retainer', 'Freight invoices 7712-7719', 'Insurance premium'];
const RISK_FLAGS = ['NEW_BENEFICIARY', 'AMOUNT_ABOVE_PROFILE', 'BENEFICIARY_CHANGED_30D', 'FIRST_WIRE_TO_COUNTRY'];
const EXCEPTION_REASONS: ExceptionReason[] = ['amount-mismatch', 'payee-mismatch', 'serial-not-issued',
  'duplicate-serial', 'stale-dated', 'no-issue-file'];
const AUDIT_ACTIONS: Array<[AuditCategory, string, string, AuditOutcome]> = [
  ['payments', 'approval.approve', 'payment', 'success'],
  ['payments', 'approval.reject', 'payment', 'success'],
  ['payments', 'approval.approve', 'payment', 'denied'],
  ['payments', 'payment.initiate', 'payment', 'success'],
  ['entitlements', 'limits.update', 'entitlement', 'success'],
  ['entitlements', 'user.disable', 'entitlement', 'success'],
  ['positive-pay', 'exception.pay', 'exception', 'success'],
  ['positive-pay', 'exception.return', 'exception', 'success'],
  ['session', 'session.sign-in', 'user', 'success'],
  ['session', 'session.mfa-failed', 'user', 'failure'],
  ['session', 'session.sign-out', 'user', 'success'],
  ['system', 'sweep.execute', 'account', 'success']
];

function shift(base: Date, minutes: number): string {
  return new Date(base.getTime() + minutes * 60_000).toISOString();
}

function atLocalHour(base: Date, dayOffset: number, hourUtc: number): string {
  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() + dayOffset);
  copy.setUTCHours(hourUtc, 0, 0, 0);
  return copy.toISOString();
}

/** Mid business day, today. Cypress passes a fixed instant instead so cutoff labels are stable. */
export function defaultAsOf(now = new Date()): string {
  const d = new Date(now.getTime());
  d.setUTCHours(14, 30, 0, 0);
  return d.toISOString();
}

export function buildTreasuryDataset(seed: string, asOfIso = defaultAsOf()): TreasuryDataset {
  const asOf = new Date(asOfIso);
  const fixtures = generateFixtures({
    seed,
    customers: 12,
    segmentMix: { consumer: 0, smallBusiness: 0, treasury: 1 },
    monthsOfHistory: 3,
    asOf: asOfIso
  });
  const random = new SeededRandom(`${seed}:treasury`);

  const organisation = fixtures.customers[0];
  const accounts = fixtures.accounts.filter(a => a.customerId === organisation.customerId);
  const entitlements = fixtures.entitlements.filter(e => e.customerId === organisation.customerId);
  const approverEntitlement = entitlements.find(e => e.role === 'approver') ?? entitlements[0];
  const initiators = entitlements.filter(e => e.role === 'initiator');

  const session: TreasurySession = {
    userHandle: approverEntitlement.userHandle,
    displayName: approverEntitlement.userHandle.split('.').slice(0, 2)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    organisationId: approverEntitlement.organisationId,
    organisationName: organisation.organisationName ?? 'Treasury client',
    role: approverEntitlement.role,
    // The approver also sees the audit view and entitlements read-only. Matches the "treasury
    // approver" profile in entitlements-service; do not widen (GIS-3088).
    permissions: [...approverEntitlement.permissions, 'audit:read', 'entitlements:view', 'positive-pay:decide'],
    expiresAt: shift(asOf, 45),
    mfaSatisfied: true
  };

  const approvals: PaymentApproval[] = [];
  for (let index = 0; index < 23; index++) {
    const account = random.pick(accounts);
    const rail = random.pick(RAILS);
    const initiator = random.pick(initiators);
    const initiatedMinutesAgo = random.int(20, 60 * 30);
    const cutoffOffset = rail === 'wire' ? random.int(-30, 240) : rail === 'rtp' ? random.int(60, 600) : random.int(120, 900);
    const statusRoll = random.next();
    const status = statusRoll < 0.6 ? 'pending' : statusRoll < 0.78 ? 'approved'
      : statusRoll < 0.88 ? 'released' : statusRoll < 0.95 ? 'rejected' : 'expired';
    const amountMinor = rail === 'wire' ? random.minorUnits(25_000, 1_850_000)
      : rail === 'book-transfer' ? random.minorUnits(100_000, 5_000_000) : random.minorUnits(1_200, 240_000);
    const flags = random.bool(0.25) ? [random.pick(RISK_FLAGS)] : [];
    approvals.push({
      approvalId: `APR-${random.digits(8)}`,
      paymentId: `PAY-${random.digits(10)}`,
      organisationId: session.organisationId,
      rail,
      amountMinor,
      currency: 'USD',
      debitAccountId: account.accountId,
      debitAccountNickname: account.nickname,
      beneficiaryName: random.pick(BENEFICIARIES),
      beneficiaryAccountLastFour: random.digits(4),
      beneficiaryRoutingNumber: TEST_ROUTING_NUMBER,
      initiatedBy: initiator.userHandle,
      initiatedAt: shift(asOf, -initiatedMinutesAgo),
      valueDate: atLocalHour(asOf, rail === 'ach' ? 1 : 0, 0).slice(0, 10),
      cutoffAt: shift(asOf, cutoffOffset),
      status,
      urgency: cutoffOffset < 0 ? 'cutoff-at-risk' : cutoffOffset < 90 ? 'same-day' : 'standard',
      approvalsRequired: initiator.dualApprovalRequired ? 2 : 1,
      approvalsGiven: status === 'pending' && random.bool(0.3) ? [random.pick(entitlements).userHandle] : [],
      memo: random.bool(0.7) ? random.pick(MEMOS) : undefined,
      riskFlags: flags
    });
  }

  const buckets: PositionBucket[] = ['operating', 'concentration', 'reserve', 'investment'];
  let operatingAssigned = false;
  const positions: LiquidityPosition[] = accounts.map((account, index) => {
    const intraday = random.minorUnits(-400_000, 650_000);
    let bucket: PositionBucket;
    if (account.type === 'treasury-operating') {
      bucket = operatingAssigned ? 'concentration' : 'operating';
      operatingAssigned = true;
    } else {
      bucket = account.type === 'business-savings' ? 'reserve' : buckets[index % buckets.length];
    }
    return {
      accountId: account.accountId,
      nickname: account.nickname,
      accountNumberMasked: maskAccountNumber(account.accountNumber),
      bucket,
      currency: account.currency,
      ledgerBalanceMinor: Math.abs(account.currentBalanceMinor) * 40,
      availableBalanceMinor: Math.abs(account.availableBalanceMinor) * 40 - Math.max(0, -intraday),
      intradayNetMinor: intraday,
      targetBalanceMinor: account.type === 'treasury-operating' ? random.minorUnits(2_000_000, 6_000_000) : null,
      asOf: asOfIso
    };
  });

  const forecast: CashForecastPoint[] = [];
  let running = positions.reduce((sum, p) => sum + p.availableBalanceMinor, 0);
  for (let day = 0; day < 14; day++) {
    running += random.minorUnits(-900_000, 1_100_000);
    forecast.push({
      date: atLocalHour(asOf, day, 0).slice(0, 10),
      projectedMinor: running,
      confirmedMinor: day < 3 ? running - random.minorUnits(0, 150_000) : Math.round(running * (1 - day * 0.045))
    });
  }

  const exceptions: PositivePayException[] = [];
  for (let index = 0; index < 11; index++) {
    const account = random.pick(accounts);
    const reason = random.pick(EXCEPTION_REASONS);
    const presented = random.minorUnits(180, 42_000);
    const decided = random.bool(0.3);
    exceptions.push({
      exceptionId: `PPX-${random.digits(7)}`,
      accountId: account.accountId,
      accountNickname: account.nickname,
      checkSerial: String(random.int(100_400, 100_999)),
      presentedAmountMinor: presented,
      issuedAmountMinor: reason === 'amount-mismatch' ? presented - random.minorUnits(1, 900)
        : reason === 'serial-not-issued' || reason === 'no-issue-file' ? null : presented,
      presentedPayee: random.pick(BENEFICIARIES),
      issuedPayee: reason === 'payee-mismatch' ? random.pick(BENEFICIARIES)
        : reason === 'serial-not-issued' || reason === 'no-issue-file' ? null : 'as presented',
      presentedAt: atLocalHour(asOf, 0, 11),
      decisionCutoffAt: atLocalHour(asOf, 0, 19),
      reason,
      decision: decided ? (random.bool(0.7) ? 'pay' : 'return') : undefined,
      decidedBy: decided ? session.userHandle : undefined,
      decidedAt: decided ? shift(asOf, -random.int(5, 120)) : undefined,
      imageAvailable: reason !== 'no-issue-file'
    });
  }

  const audit: AuditEvent[] = [];
  for (let index = 0; index < 140; index++) {
    const [category, action, subjectType, outcome] = random.pick(AUDIT_ACTIONS);
    const actor = random.pick(entitlements);
    audit.push({
      eventId: `EVT-${random.digits(10)}`,
      occurredAt: shift(asOf, -random.int(2, 60 * 24 * 21)),
      category,
      action,
      actor: actor.userHandle,
      actorRole: actor.role,
      subjectType,
      subjectId: subjectType === 'payment' ? `PAY-${random.digits(10)}`
        : subjectType === 'exception' ? `PPX-${random.digits(7)}`
          : subjectType === 'account' ? random.pick(accounts).accountId : actor.entitlementId,
      outcome,
      correlationId: `ldg-${random.digits(24)}`,
      sourceIp: `10.${random.int(40, 47)}.${random.int(0, 255)}.${random.int(1, 254)}`,
      detail: outcome === 'denied' ? 'Entitlement check failed: payments:approve' : undefined
    });
  }
  audit.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return { asOf, organisation, accounts, entitlements, session, approvals, positions, forecast, exceptions, audit };
}
