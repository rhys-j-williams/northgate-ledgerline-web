import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import {
  ApprovalsApi, AuditApi, EntitlementsApi, LiquidityApi, PositivePayApi, TickerHausApi
} from '../api';
import { ApiError } from '../http/api-error';
import { provideFixtureBackend, TEST_ENVIRONMENT } from '../../testing/fixture-backend-testing';
import { FixtureBackendState } from './fixture-backend.state';

describe('fixtureBackendInterceptor', () => {
  let state: FixtureBackendState;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    state = TestBed.inject(FixtureBackendState);
  });

  const expectApiError = async (p: Promise<unknown>, status: number, code: string) => {
    await expect(p).rejects.toMatchObject({ status, code } satisfies Partial<ApiError>);
  };

  it('answers the session route and signs out', async () => {
    const http = TestBed.inject(HttpClient);
    const session = await firstValueFrom(http.get<{ userHandle: string }>(`${TEST_ENVIRONMENT.bffBaseUrl}/v1/session`));
    expect(session.userHandle).toBe(state.dataset.session.userHandle);
    await firstValueFrom(http.post(`${TEST_ENVIRONMENT.bffBaseUrl}/v1/session/sign-out`, {}), { defaultValue: null });
    await expectApiError(firstValueFrom(http.get(`${TEST_ENVIRONMENT.bffBaseUrl}/v1/session`)), 401, 'NO_SESSION');
    state.reset();
    expect(state.signedOut).toBe(false);
  });

  it('lets unknown hosts through to the real handler', async () => {
    const http = TestBed.inject(HttpClient);
    // No backend behind jsdom's XHR: the request fails at the network layer, i.e. it was not short-circuited.
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expectApiError(firstValueFrom(http.get('http://elsewhere.test/v1/session')), 0, 'NETWORK');
    quiet.mockRestore();
  });

  it('404s routes the UI does not use', async () => {
    const http = TestBed.inject(HttpClient);
    await expectApiError(firstValueFrom(http.get(`${TEST_ENVIRONMENT.bffBaseUrl}/v1/treasury/nothing`)), 404, 'NOT_FOUND');
  });

  describe('approvals', () => {
    it('filters by status and rail', async () => {
      const api = TestBed.inject(ApprovalsApi);
      const all = await firstValueFrom(api.list());
      expect(all.length).toBe(state.dataset.approvals.length);
      const pendingWires = await firstValueFrom(api.list({ status: ['pending'], rail: ['wire'] }));
      expect(pendingWires.every(a => a.status === 'pending' && a.rail === 'wire')).toBe(true);
      expect(pendingWires.length).toBe(all.filter(a => a.status === 'pending' && a.rail === 'wire').length);
    });

    it('gets one and 404s a missing one', async () => {
      const api = TestBed.inject(ApprovalsApi);
      const first = state.dataset.approvals[0];
      expect((await firstValueFrom(api.get(first.approvalId))).paymentId).toBe(first.paymentId);
      await expectApiError(firstValueFrom(api.get('APR-nope')), 404, 'APPROVAL_NOT_FOUND');
    });

    it('applies the four-eyes rules on decision', async () => {
      const api = TestBed.inject(ApprovalsApi);
      const me = state.dataset.session.userHandle;
      const pending = state.dataset.approvals.find(a => a.status === 'pending' && a.initiatedBy !== me && a.approvalsRequired - a.approvalsGiven.length === 1);
      expect(pending).toBeDefined();
      const result = await firstValueFrom(api.decide({ approvalId: pending!.approvalId, decision: 'approve' }));
      expect(result.status).toBe('approved');
      expect(result.approvalsGiven).toContain(me);
      await expectApiError(firstValueFrom(api.decide({ approvalId: pending!.approvalId, decision: 'approve' })), 409, 'APPROVAL_NOT_PENDING');

      const rejectable = state.dataset.approvals.find(a => a.status === 'pending' && a.initiatedBy !== me);
      const rejected = await firstValueFrom(api.decide({ approvalId: rejectable!.approvalId, decision: 'reject', reason: 'duplicate' }));
      expect(rejected.status).toBe('rejected');

      const own = state.dataset.approvals.find(a => a.status === 'pending' && a.initiatedBy === me);
      if (own) {
        await expectApiError(firstValueFrom(api.decide({ approvalId: own.approvalId, decision: 'approve' })), 422, 'SELF_APPROVAL');
      }
    });
  });

  it('serves the liquidity snapshot as of the fixture clock', async () => {
    const snapshot = await firstValueFrom(TestBed.inject(LiquidityApi).snapshot());
    expect(snapshot.asOf).toBe(state.dataset.asOf.toISOString());
    expect(snapshot.positions.length).toBe(state.dataset.positions.length);
    expect(snapshot.forecast.length).toBe(state.dataset.forecast.length);
  });

  describe('entitlements', () => {
    it('lists, gets and updates limits', async () => {
      const api = TestBed.inject(EntitlementsApi);
      const rows = await firstValueFrom(api.list());
      expect(rows.length).toBe(state.dataset.entitlements.length);
      const target = rows[0];
      expect((await firstValueFrom(api.get(target.entitlementId))).userHandle).toBe(target.userHandle);
      const updated = await firstValueFrom(api.updateLimits(target.entitlementId, {
        limitPerTransactionMinor: 12_500_00, limitPerDayMinor: null, dualApprovalRequired: true
      }));
      expect(updated.limitPerTransactionMinor).toBe(1_250_000);
      expect(updated.limitPerDayMinor).toBeUndefined();
      expect(updated.dualApprovalRequired).toBe(true);
      await expectApiError(firstValueFrom(api.get('ENT-nope')), 404, 'ENTITLEMENT_NOT_FOUND');
    });
  });

  describe('positive pay', () => {
    it('decides a batch and leaves the rest alone', async () => {
      const api = TestBed.inject(PositivePayApi);
      const open = (await firstValueFrom(api.list())).filter(e => e.decision === undefined);
      const [first, second] = open;
      const updated = await firstValueFrom(api.decide({ exceptionIds: [first.exceptionId, second.exceptionId], decision: 'return', note: 'not ours' }));
      expect(updated.map(e => e.exceptionId).sort()).toEqual([first.exceptionId, second.exceptionId].sort());
      expect(updated.every(e => e.decision === 'return' && e.decidedBy === state.dataset.session.userHandle)).toBe(true);
      const after = (await firstValueFrom(api.list())).filter(e => e.decision === undefined);
      expect(after.length).toBe(open.length - 2);
    });
  });

  describe('audit', () => {
    it('pages and filters server side', async () => {
      const api = TestBed.inject(AuditApi);
      const page0 = await firstValueFrom(api.search({}, 0, 10));
      const page1 = await firstValueFrom(api.search({}, 1, 10));
      expect(page0.events.length).toBe(10);
      expect(page0.total).toBe(state.dataset.audit.length);
      expect(page0.events[0].eventId).not.toBe(page1.events[0].eventId);

      const payments = await firstValueFrom(api.search({ categories: ['payments'] }, 0, 500));
      expect(payments.events.every(e => e.category === 'payments')).toBe(true);
      expect(payments.total).toBe(state.dataset.audit.filter(e => e.category === 'payments').length);

      const actor = state.dataset.audit[0].actor;
      const byActor = await firstValueFrom(api.search({ actor: actor.toUpperCase() }, 0, 500));
      expect(byActor.events.every(e => e.actor.includes(actor))).toBe(true);

      const corr = state.dataset.audit[3].correlationId;
      const byText = await firstValueFrom(api.search({ text: corr }, 0, 500));
      expect(byText.events.some(e => e.correlationId === corr)).toBe(true);

      const from = '2024-11-10T00:00:00.000Z';
      const windowed = await firstValueFrom(api.search({ from, to: state.dataset.asOf.toISOString() }, 0, 500));
      expect(windowed.events.every(e => e.occurredAt >= from)).toBe(true);
    });

    it('exports CSV with a header row', async () => {
      const blob = await firstValueFrom(TestBed.inject(AuditApi).exportCsv({ from: '2024-11-01T00:00:00.000Z' }));
      // jsdom's Blob has no text(); go through FileReader like the download code path would.
      const text = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      const [header, ...rows] = text.split('\n');
      expect(header).toBe('eventId,occurredAt,category,action,actor,outcome,subjectId,correlationId');
      expect(rows.length).toBe(state.dataset.audit.length);
    });
  });

  describe('tickerhaus', () => {
    it('quotes known pairs with a moving mid and rejects unknown ones', async () => {
      const api = TestBed.inject(TickerHausApi);
      const { pairs } = await firstValueFrom(api.pairs());
      expect(pairs).toContain('EURUSD');
      const a = await firstValueFrom(api.rates(['EURUSD', 'USDJPY']));
      const b = await firstValueFrom(api.rates(['EURUSD', 'USDJPY']));
      expect(a.rates.map(r => r.pair)).toEqual(['EURUSD', 'USDJPY']);
      expect(a.rates[0].bid).toBeLessThan(a.rates[0].ask);
      expect(a.rates[0].mid).not.toBe(b.rates[0].mid);
      expect(String(a.rates[1].mid).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(3);
      await expectApiError(firstValueFrom(api.rates(['XXXYYY'])), 400, 'UNKNOWN_PAIR');
    });
  });
});
