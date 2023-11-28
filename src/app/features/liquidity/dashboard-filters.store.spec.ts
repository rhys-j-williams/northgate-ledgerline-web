import { ALL_BUCKETS, DashboardFiltersStore } from './dashboard-filters.store';

describe('DashboardFiltersStore', () => {
  it('treats no bucket selection as every bucket', () => {
    const store = new DashboardFiltersStore();
    expect(store.effectiveBuckets()).toEqual(ALL_BUCKETS);
    expect(store.isFiltered()).toBe(false);
    store.buckets.set(['operating']);
    expect(store.effectiveBuckets()).toEqual(['operating']);
    expect(store.isFiltered()).toBe(true);
  });

  it('counts currency and hide-zero as filters but not the view toggles', () => {
    const store = new DashboardFiltersStore();
    store.balanceView.set('ledger');
    store.horizon.set(14);
    expect(store.isFiltered()).toBe(false);
    store.currency.set('EUR');
    expect(store.isFiltered()).toBe(true);
    store.currency.set(null);
    store.hideZero.set(true);
    expect(store.isFiltered()).toBe(true);
    store.reset();
    expect(store.isFiltered()).toBe(false);
    expect(store.balanceView()).toBe('available');
    expect(store.horizon()).toBe(7);
  });
});
