import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CnButtonModule } from '@meridian/canopy-ui/actions';

import { LdgFilterChip, LdgFilterChipsComponent } from '../../canopy-compat';
import { PositionBucket } from '../../core/models/liquidity';
import { TitleCaseTokenPipe } from '../../shared/pipes/title-case-token.pipe';
import { ALL_BUCKETS, BalanceView, DashboardFiltersStore, ForecastHorizon } from './dashboard-filters.store';

@Component({
  selector: 'ldg-dashboard-filters',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, MatButtonToggleModule, MatSlideToggleModule, CnButtonModule, LdgFilterChipsComponent, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-filters.component.html'
})
export class DashboardFiltersComponent {
  protected readonly filters = inject(DashboardFiltersStore);
  private readonly currencyList = signal<string[]>([]);

  @Input() set currencies(value: string[]) {
    this.currencyList.set(value);
  }

  protected readonly bucketChips: LdgFilterChip<PositionBucket>[] = ALL_BUCKETS.map(bucket => ({
    value: bucket, label: new TitleCaseTokenPipe().transform(bucket)
  }));

  protected readonly currencyChips = computed<LdgFilterChip<string>[]>(() =>
    this.currencyList().map(code => ({ value: code, label: code })));

  protected readonly showCurrency = computed(() => this.currencyList().length > 1);

  onBuckets(values: PositionBucket[]): void {
    this.filters.buckets.set(values);
  }

  onCurrency(values: string[]): void {
    this.filters.currency.set(values[0] ?? null);
  }

  onView(view: BalanceView): void {
    this.filters.balanceView.set(view);
  }

  onHorizon(horizon: ForecastHorizon): void {
    this.filters.horizon.set(horizon);
  }
}
