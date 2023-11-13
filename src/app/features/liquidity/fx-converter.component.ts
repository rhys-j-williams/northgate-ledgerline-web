import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FxQuote } from '../../core/models/fx';

/** Indicative "what would 1,000,000 base cost" widget for the selected pair. Not a dealing ticket. */
@Component({
  selector: 'ldg-fx-converter',
  standalone: true,
  imports: [DecimalPipe, FormsModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ldg-fx-converter">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Amount in {{ quoteSignal().base }}</mat-label>
        <input matInput type="number" inputmode="decimal" min="0" step="1000" [ngModel]="amount()" (ngModelChange)="amount.set($event ?? 0)">
      </mat-form-field>
      <dl class="ldg-fx-converter__out">
        <dt>Buy {{ quoteSignal().quote }} at ask</dt><dd class="ldg-num">{{ atAsk() | number:'1.2-2' }}</dd>
        <dt>Sell at bid</dt><dd class="ldg-num">{{ atBid() | number:'1.2-2' }}</dd>
      </dl>
    </div>
  `,
  styles: [`
    .ldg-fx-converter { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--cn-color-border); }
    .ldg-fx-converter__out { margin: 0; font-size: 13px; }
    .ldg-fx-converter__out dt { color: var(--cn-color-text-muted); }
    .ldg-fx-converter__out dd { margin: 0 0 6px; font-weight: 600; }
  `]
})
export class FxConverterComponent {
  protected readonly quoteSignal = signal<FxQuote>({ pair: '', base: '', quote: '', bid: 0, ask: 0, mid: 0, timestamp: '', source: '' });
  readonly amount = signal(1_000_000);

  @Input({ required: true }) set quote(value: FxQuote) {
    this.quoteSignal.set(value);
  }

  readonly atAsk = computed(() => this.amount() * this.quoteSignal().ask);
  readonly atBid = computed(() => this.amount() * this.quoteSignal().bid);
}
