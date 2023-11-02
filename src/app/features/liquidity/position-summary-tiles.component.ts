import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';

import { LiquidityPosition } from '../../core/models/liquidity';
import { KpiTileComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { BalanceView } from './dashboard-filters.store';

@Component({
  selector: 'ldg-position-summary-tiles',
  standalone: true,
  imports: [KpiTileComponent],
  providers: [MinorAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ldg-grid">
      <ldg-kpi-tile [label]="viewSignal() === 'ledger' ? 'Total ledger' : 'Total available'" [value]="fmt(total())" [hint]="count() + ' accounts'"></ldg-kpi-tile>
      <ldg-kpi-tile label="Intraday net" [value]="fmt(intraday(), 'signed')" [trend]="intraday() > 0 ? 'up' : intraday() < 0 ? 'down' : 'flat'" hint="Since opening ledger"></ldg-kpi-tile>
      <ldg-kpi-tile label="Below sweep target" [value]="belowTarget().toString()" [trend]="belowTarget() ? 'down' : 'flat'" hint="Concentration engine will move funds at 15:00 ET"></ldg-kpi-tile>
      <ldg-kpi-tile label="Largest position" [value]="largest()?.nickname ?? '—'" [hint]="largest() ? fmt(pick(largest()!)) : null"></ldg-kpi-tile>
    </div>
  `
})
export class PositionSummaryTilesComponent {
  private readonly amount = inject(MinorAmountPipe);
  private readonly rows = signal<LiquidityPosition[]>([]);
  protected readonly viewSignal = signal<BalanceView>('available');

  @Input({ required: true }) set positions(value: LiquidityPosition[]) {
    this.rows.set(value);
  }
  @Input({ required: true }) set view(value: BalanceView) {
    this.viewSignal.set(value);
  }

  readonly count = computed(() => this.rows().length);
  readonly total = computed(() => this.rows().reduce((sum, p) => sum + this.pick(p), 0));
  readonly intraday = computed(() => this.rows().reduce((sum, p) => sum + p.intradayNetMinor, 0));
  readonly belowTarget = computed(() =>
    this.rows().filter(p => p.targetBalanceMinor !== null && p.availableBalanceMinor < p.targetBalanceMinor).length);
  readonly largest = computed(() =>
    this.rows().reduce<LiquidityPosition | null>((best, p) => !best || this.pick(p) > this.pick(best) ? p : best, null));

  pick(position: LiquidityPosition): number {
    return this.viewSignal() === 'ledger' ? position.ledgerBalanceMinor : position.availableBalanceMinor;
  }

  fmt(minor: number, style: 'plain' | 'signed' | 'compact' = 'compact'): string {
    return this.amount.transform(minor, 'USD', style);
  }
}
