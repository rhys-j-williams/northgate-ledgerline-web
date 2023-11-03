import { computed, Injectable, signal } from '@angular/core';

import { PositionBucket } from '../../core/models/liquidity';

export type ForecastHorizon = 7 | 14;
export type BalanceView = 'ledger' | 'available';

export const ALL_BUCKETS: PositionBucket[] = ['operating', 'concentration', 'reserve', 'investment'];

/**
 * Dashboard view state as signals. Owned by the dashboard route so it resets on navigation away;
 * treasury asked for that after the "why is my dashboard still filtered from yesterday" tickets.
 */
@Injectable()
export class DashboardFiltersStore {
  readonly buckets = signal<PositionBucket[]>([]);
  readonly currency = signal<string | null>(null);
  readonly balanceView = signal<BalanceView>('available');
  readonly horizon = signal<ForecastHorizon>(7);
  readonly hideZero = signal(false);

  readonly effectiveBuckets = computed<PositionBucket[]>(() => this.buckets().length ? this.buckets() : ALL_BUCKETS);
  readonly isFiltered = computed(() => this.buckets().length > 0 || this.currency() !== null || this.hideZero());

  reset(): void {
    this.buckets.set([]);
    this.currency.set(null);
    this.balanceView.set('available');
    this.horizon.set(7);
    this.hideZero.set(false);
  }
}
