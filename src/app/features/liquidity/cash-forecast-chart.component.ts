import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Input, signal } from '@angular/core';
import { CnCardModule } from '@meridian/canopy-ui/data-display';

import { CashForecastPoint } from '../../core/models/liquidity';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';

interface Bar {
  point: CashForecastPoint;
  projectedPct: number;
  confirmedPct: number;
}

/**
 * Plain SVG bars. We had a charting library here for a quarter (LDG-733) and removed it: 180 kB
 * for one chart, and its tooltips failed the axe scan. If this grows past bars, revisit.
 */
@Component({
  selector: 'ldg-cash-forecast-chart',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, CnCardModule, MinorAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cash-forecast-chart.component.html',
  styles: [`
    .ldg-forecast { display: block; }
    .ldg-forecast__chart { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; align-items: end; height: 160px; padding-top: 8px; }
    .ldg-forecast__col { display: flex; flex-direction: column; justify-content: flex-end; height: 100%; position: relative; }
    .ldg-forecast__bar { width: 100%; border-radius: 3px 3px 0 0; background: var(--cn-color-border-strong); position: relative; }
    .ldg-forecast__bar--confirmed { position: absolute; left: 0; right: 0; bottom: 0; background: var(--cn-color-primary); border-radius: 3px 3px 0 0; }
    .ldg-forecast__label { font-size: 11px; text-align: center; margin-top: 4px; color: var(--cn-color-text-muted); }
    .ldg-forecast__legend { display: flex; gap: 16px; font-size: 12px; margin-top: 12px; }
    .ldg-forecast__swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
    .ldg-forecast__table { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  `]
})
export class CashForecastChartComponent {
  private readonly pointsSignal = signal<CashForecastPoint[]>([]);
  protected readonly horizonSignal = signal(7);

  @Input({ required: true }) set points(value: CashForecastPoint[]) {
    this.pointsSignal.set(value);
  }
  @Input() set horizon(value: number) {
    this.horizonSignal.set(value);
  }

  readonly bars = computed<Bar[]>(() => {
    const points = this.pointsSignal();
    const max = Math.max(1, ...points.map(p => Math.max(p.projectedMinor, p.confirmedMinor)));
    return points.map(point => ({
      point,
      projectedPct: Math.max(2, Math.round((point.projectedMinor / max) * 100)),
      confirmedPct: Math.round((point.confirmedMinor / max) * 100)
    }));
  });

  readonly lowPoint = computed(() =>
    this.pointsSignal().reduce<CashForecastPoint | null>((low, p) => !low || p.projectedMinor < low.projectedMinor ? p : low, null));
}
