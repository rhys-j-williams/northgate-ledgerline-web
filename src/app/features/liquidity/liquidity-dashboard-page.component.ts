import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';

import { LiquidityApi } from '../../core/api/liquidity.api';
import { ApiError } from '../../core/http/api-error';
import { LiquidityPosition, LiquiditySnapshot } from '../../core/models/liquidity';
import { ErrorStateComponent, LoadingStateComponent } from '../../shared/components';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { CashForecastChartComponent } from './cash-forecast-chart.component';
import { DashboardFiltersComponent } from './dashboard-filters.component';
import { DashboardFiltersStore } from './dashboard-filters.store';
import { FxRatesPanelComponent } from './fx-rates-panel.component';
import { PositionSummaryTilesComponent } from './position-summary-tiles.component';
import { PositionsTableComponent } from './positions-table.component';

@Component({
  selector: 'ldg-liquidity-dashboard-page',
  standalone: true,
  imports: [
    NgIf, CnPageHeaderModule, CnButtonModule, DashboardFiltersComponent, PositionSummaryTilesComponent,
    PositionsTableComponent, CashForecastChartComponent, FxRatesPanelComponent, LoadingStateComponent,
    ErrorStateComponent, RelativeTimePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './liquidity-dashboard-page.component.html',
  styles: [`
    .ldg-dashboard__main { display: grid; gap: var(--ldg-grid-gap); grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr); }
    @media (max-width: 1100px) { .ldg-dashboard__main { grid-template-columns: 1fr; } }
  `]
})
export class LiquidityDashboardPageComponent implements OnInit {
  private readonly api = inject(LiquidityApi);
  protected readonly filters = inject(DashboardFiltersStore);

  protected readonly snapshot = signal<LiquiditySnapshot | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly currencies = computed(() =>
    [...new Set((this.snapshot()?.positions ?? []).map(p => p.currency))].sort());

  protected readonly positions = computed<LiquidityPosition[]>(() => {
    const snap = this.snapshot();
    if (!snap) return [];
    const buckets = this.filters.effectiveBuckets();
    const currency = this.filters.currency();
    const hideZero = this.filters.hideZero();
    return snap.positions.filter(p =>
      buckets.includes(p.bucket)
      && (!currency || p.currency === currency)
      && (!hideZero || p.ledgerBalanceMinor !== 0));
  });

  protected readonly forecast = computed(() => (this.snapshot()?.forecast ?? []).slice(0, this.filters.horizon()));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.snapshot().subscribe({
      next: snap => {
        this.snapshot.set(snap);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      }
    });
  }
}
