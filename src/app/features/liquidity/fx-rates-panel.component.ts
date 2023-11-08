import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CnCardModule } from '@meridian/canopy-ui/data-display';
import { switchMap } from 'rxjs';

import { TickerHausApi } from '../../core/api/tickerhaus.api';
import { APP_CONFIG } from '../../core/config/app-config';
import { ApiError } from '../../core/http/api-error';
import { FxQuote } from '../../core/models/fx';
import { ErrorStateComponent, LoadingStateComponent } from '../../shared/components';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { FxConverterComponent } from './fx-converter.component';
import { FxRateRowComponent } from './fx-rate-row.component';

// TickerHaus pair codes are six letters, no separator (their API guide v2.3).
const WATCHED_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDMXN'];

@Component({
  selector: 'ldg-fx-rates-panel',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, CnCardModule, FxRateRowComponent, FxConverterComponent, LoadingStateComponent, ErrorStateComponent, RelativeTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-card title="FX rates" [subtitle]="subtitle()">
      <ldg-loading-state *ngIf="!quotes().length && !error()" [rows]="5" [compact]="true"></ldg-loading-state>
      <ldg-error-state *ngIf="error() as err" [error]="err" title="Rates unavailable"
                       body="TickerHaus did not answer. Positions are unaffected; indicative rates come back when the feed does." (retry)="start()"></ldg-error-state>
      <ol class="ldg-fx__list" *ngIf="quotes().length" aria-label="Indicative FX rates">
        <li *ngFor="let quote of quotes(); trackBy: trackByPair">
          <ldg-fx-rate-row [quote]="quote" [previous]="previousFor(quote.pair)" [selected]="selectedPair() === quote.pair" (pairSelect)="selectedPair.set(quote.pair)"></ldg-fx-rate-row>
        </li>
      </ol>
      <ldg-fx-converter *ngIf="selected() as q" [quote]="q"></ldg-fx-converter>
      <p class="ldg-muted ldg-fx__foot" *ngIf="asOf()">Indicative only, {{ asOf() | relativeTime }}. Source: TickerHaus{{ streaming ? ' (streaming)' : ', polled every 15 s' }}.</p>
    </cn-card>
  `,
  styles: [`
    .ldg-fx__list { list-style: none; margin: 0; padding: 0; }
    .ldg-fx__foot { font-size: 12px; margin: 12px 0 0; }
  `]
})
export class FxRatesPanelComponent implements OnInit {
  private readonly api = inject(TickerHausApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly streaming = inject(APP_CONFIG).featureFlags.fxStreaming;

  protected readonly quotes = signal<FxQuote[]>([]);
  protected readonly previous = signal<Record<string, FxQuote>>({});
  protected readonly asOf = signal<string | null>(null);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly selectedPair = signal<string>(WATCHED_PAIRS[0]);

  protected readonly selected = computed(() => this.quotes().find(q => q.pair === this.selectedPair()) ?? null);
  protected readonly subtitle = computed(() => this.quotes().length ? `${this.quotes().length} pairs watched` : 'Connecting to TickerHaus');

  ngOnInit(): void {
    this.start();
  }

  start(): void {
    this.error.set(null);
    this.api.pairs().pipe(
      switchMap(({ pairs }) => this.api.pollRates(WATCHED_PAIRS.filter(p => pairs.includes(p)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: response => {
        this.previous.set(Object.fromEntries(this.quotes().map(q => [q.pair, q])));
        this.quotes.set(response.rates);
        this.asOf.set(response.asOf);
      },
      error: (err: ApiError) => this.error.set(err)
    });
  }

  previousFor(pair: string): FxQuote | null {
    return this.previous()[pair] ?? null;
  }

  trackByPair(_: number, quote: FxQuote): string {
    return quote.pair;
  }
}
