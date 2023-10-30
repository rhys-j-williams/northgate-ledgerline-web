import { TestBed } from '@angular/core/testing';
import { flushMicrotasks, provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { FixtureBackendState } from '../../core/fixture-backend/fixture-backend.state';
import { ApprovalsApi } from '../../core/api/approvals.api';
import { ApiError } from '../../core/http/api-error';
import { throwError } from 'rxjs';
import { ApprovalsStore } from './approvals.store';

describe('ApprovalsStore', () => {
  let store: ApprovalsStore;
  let state: FixtureBackendState;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    store = TestBed.inject(ApprovalsStore);
    state = TestBed.inject(FixtureBackendState);
  });

  it('loads the queue and derives the counters', async () => {
    expect(store.loading()).toBe(false);
    store.load();
    expect(store.loading()).toBe(true);
    await flushMicrotasks();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    const pending = state.dataset.approvals.filter(a => a.status === 'pending');
    expect(store.pendingCount()).toBe(pending.length);
    expect(store.pendingTotalMinor()).toBe(pending.reduce((s, a) => s + a.amountMinor, 0));
    expect(store.cutoffAtRiskCount()).toBe(pending.filter(a => a.urgency === 'cutoff-at-risk').length);
    const counts = store.railCounts();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(pending.length);
  });

  it('defaults to pending, sorted by cutoff, and filters by rail and search', async () => {
    store.load();
    await flushMicrotasks();
    const visible = store.visible();
    expect(visible.every(a => a.status === 'pending')).toBe(true);
    for (let i = 1; i < visible.length; i++) {
      expect(visible[i - 1].cutoffAt <= visible[i].cutoffAt).toBe(true);
    }

    store.railFilter.set(['ach']);
    expect(store.visible().every(a => a.rail === 'ach')).toBe(true);

    store.statusFilter.set([]);
    store.railFilter.set([]);
    expect(store.visible().length).toBe(state.dataset.approvals.length);

    const target = state.dataset.approvals[0];
    store.search.set(target.beneficiaryName.slice(0, 6).toUpperCase());
    expect(store.visible().some(a => a.approvalId === target.approvalId)).toBe(true);

    store.clearFilters();
    expect(store.statusFilter()).toEqual(['pending']);
    expect(store.search()).toBe('');
  });

  it('sorts by amount and initiated', async () => {
    store.load();
    await flushMicrotasks();
    store.statusFilter.set([]);
    store.sort.set('amount');
    const byAmount = store.visible();
    expect(byAmount[0].amountMinor).toBeGreaterThanOrEqual(byAmount[byAmount.length - 1].amountMinor);
    store.sort.set('initiated');
    const byInitiated = store.visible();
    expect(byInitiated[0].initiatedAt >= byInitiated[byInitiated.length - 1].initiatedAt).toBe(true);
  });

  it('refreshCount fills an empty store once and then leaves it alone', async () => {
    store.refreshCount();
    await flushMicrotasks();
    const before = store.pendingCount();
    expect(before).toBeGreaterThan(0);
    state.dataset.approvals[0].status = 'expired';
    store.refreshCount();
    await flushMicrotasks();
    expect(store.pendingCount()).toBe(before);
  });

  it('decide updates the row in place and drops the pending badge', async () => {
    store.load();
    await flushMicrotasks();
    const me = state.dataset.session.userHandle;
    const target = store.visible().find(a => a.initiatedBy !== me && a.approvalsRequired - a.approvalsGiven.length === 1)!;
    const before = store.pendingCount();
    const promise = store.decide({ approvalId: target.approvalId, decision: 'approve' });
    expect(store.deciding()).toBe(target.approvalId);
    await promise;
    expect(store.deciding()).toBeNull();
    expect(store.byId(target.approvalId)?.status).toBe('approved');
    expect(store.pendingCount()).toBe(before - 1);
  });

  it('decide rejects with the ApiError from the BFF', async () => {
    store.load();
    await flushMicrotasks();
    const done = state.dataset.approvals.find(a => a.status !== 'pending')!;
    await expect(store.decide({ approvalId: done.approvalId, decision: 'approve' }))
      .rejects.toMatchObject({ status: 409 } satisfies Partial<ApiError>);
  });

  it('records a load failure and clears it on the next load', async () => {
    const api = TestBed.inject(ApprovalsApi);
    const failure: ApiError = { status: 503, code: 'HTTP_503', message: 'down', correlationId: null };
    const spy = jest.spyOn(api, 'list').mockReturnValueOnce(throwError(() => failure));
    store.load();
    await flushMicrotasks();
    expect(store.error()).toEqual(failure);
    expect(store.loading()).toBe(false);
    spy.mockRestore();
    store.load();
    await flushMicrotasks();
    expect(store.error()).toBeNull();
    expect(store.approvals().length).toBeGreaterThan(0);
  });
});
