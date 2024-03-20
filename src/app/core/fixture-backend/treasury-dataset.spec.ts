import { buildTreasuryDataset, defaultAsOf } from './treasury-dataset';

describe('buildTreasuryDataset', () => {
  const asOf = '2024-11-15T14:30:00.000Z';

  it('is deterministic for a seed', () => {
    const a = buildTreasuryDataset('spec', asOf);
    const b = buildTreasuryDataset('spec', asOf);
    expect(a.approvals.map(x => x.approvalId)).toEqual(b.approvals.map(x => x.approvalId));
    expect(a.session).toEqual(b.session);
    expect(buildTreasuryDataset('other', asOf).session.userHandle).not.toBe(a.session.userHandle);
  });

  it('only contains treasury segment data with fixture guarantees', () => {
    const data = buildTreasuryDataset('spec', asOf);
    expect(data.organisation.segment).toBe('treasury');
    expect(data.accounts.length).toBeGreaterThan(0);
    for (const account of data.accounts) {
      expect(account.routingNumber).toBe('021000000');
      expect(account.customerId).toBe(data.organisation.customerId);
    }
    for (const approval of data.approvals) {
      expect(data.accounts.some(a => a.accountId === approval.debitAccountId)).toBe(true);
      expect(approval.approvalsGiven.length).toBeLessThanOrEqual(approval.approvalsRequired);
    }
  });

  it('gives the session an approver with the read-only extras', () => {
    const { session, entitlements } = buildTreasuryDataset('spec', asOf);
    expect(session.role).toBe('approver');
    expect(session.permissions).toEqual(expect.arrayContaining(['audit:read', 'entitlements:view', 'positive-pay:decide']));
    expect(entitlements.some(e => e.userHandle === session.userHandle)).toBe(true);
    expect(new Date(session.expiresAt).getTime()).toBe(new Date(asOf).getTime() + 45 * 60_000);
  });

  it('spreads work across statuses, rails and exception reasons', () => {
    const data = buildTreasuryDataset('spec', asOf);
    expect(new Set(data.approvals.map(a => a.status)).size).toBeGreaterThan(2);
    expect(new Set(data.approvals.map(a => a.rail)).size).toBeGreaterThan(2);
    expect(data.approvals.filter(a => a.status === 'pending').length).toBeGreaterThan(3);
    expect(data.exceptions.filter(e => e.decision === undefined).length).toBeGreaterThan(0);
    expect(new Set(data.exceptions.map(e => e.reason)).size).toBeGreaterThan(2);
    expect(data.positions.length).toBe(data.accounts.length);
    expect(data.forecast.length).toBeGreaterThanOrEqual(14);
    expect(data.audit.length).toBeGreaterThan(50);
  });

  it('defaults the clock to 14:30Z today', () => {
    expect(defaultAsOf(new Date('2026-03-02T03:04:05.000Z'))).toBe('2026-03-02T14:30:00.000Z');
    expect(new Date(defaultAsOf()).getUTCHours()).toBe(14);
  });
});
