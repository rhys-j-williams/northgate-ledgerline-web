import { DecimalPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { FxQuote } from '../../core/models/fx';

@Component({
  selector: 'ldg-fx-rate-row',
  standalone: true,
  imports: [NgIf, DecimalPipe, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="ldg-fx-row" [class.ldg-fx-row--selected]="selected" [attr.aria-pressed]="selected" (click)="pairSelect.emit()">
      <span class="ldg-fx-row__pair">{{ quote.pair }}</span>
      <span class="ldg-fx-row__mid ldg-num">{{ quote.mid | number:digits }}</span>
      <span class="ldg-fx-row__move ldg-num" [class.ldg-positive]="direction === 'up'" [class.ldg-negative]="direction === 'down'">
        <mat-icon *ngIf="direction !== 'flat'" [svgIcon]="direction === 'up' ? 'cn:arrow-up' : 'cn:arrow-down'" aria-hidden="true"></mat-icon>
        <span class="cdk-visually-hidden">{{ direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'unchanged' }}</span>
        <span *ngIf="direction !== 'flat'">{{ move | number:'1.4-4' }}</span>
      </span>
      <span class="ldg-fx-row__spread ldg-muted ldg-num">{{ quote.bid | number:digits }} / {{ quote.ask | number:digits }}</span>
    </button>
  `,
  styles: [`
    .ldg-fx-row { display: grid; grid-template-columns: 80px 1fr auto auto; gap: 12px; align-items: center; width: 100%; padding: 8px 10px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
    .ldg-fx-row:hover, .ldg-fx-row:focus-visible { background: var(--cn-color-surface-alt); }
    .ldg-fx-row--selected { background: var(--cn-color-surface-alt); box-shadow: inset 3px 0 0 var(--cn-color-primary); }
    .ldg-fx-row__pair { font-weight: 600; }
    .ldg-fx-row__mid { font-size: 16px; }
    .ldg-fx-row__move { display: inline-flex; align-items: center; font-size: 12px; min-width: 64px; justify-content: flex-end; }
    .ldg-fx-row__move .mat-icon { width: 14px; height: 14px; font-size: 14px; }
    .ldg-fx-row__spread { font-size: 12px; }
  `]
})
export class FxRateRowComponent {
  @Input({ required: true }) quote!: FxQuote;
  @Input() previous: FxQuote | null = null;
  @Input() selected = false;
  @Output() readonly pairSelect = new EventEmitter<void>();

  get digits(): string {
    return this.quote.quote === 'JPY' ? '1.2-2' : '1.4-4';
  }

  get move(): number {
    return this.previous ? this.quote.mid - this.previous.mid : 0;
  }

  get direction(): 'up' | 'down' | 'flat' {
    const m = this.move;
    return Math.abs(m) < 1e-9 ? 'flat' : m > 0 ? 'up' : 'down';
  }
}
