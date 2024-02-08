import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CnButtonModule } from '@meridian/canopy-ui/actions';

import { LdgFilterChip, LdgFilterChipsComponent } from '../../canopy-compat';
import { ExceptionReason } from '../../core/models/positive-pay';

export interface BulkDecision {
  decision: 'pay' | 'return';
  note?: string;
}

const REASON_CHIPS: LdgFilterChip<ExceptionReason>[] = [
  { value: 'amount-mismatch', label: 'Amount' },
  { value: 'payee-mismatch', label: 'Payee' },
  { value: 'serial-not-issued', label: 'Not issued' },
  { value: 'duplicate-serial', label: 'Duplicate' },
  { value: 'stale-dated', label: 'Stale dated' },
  { value: 'no-issue-file', label: 'No issue file' }
];

@Component({
  selector: 'ldg-exception-decision-bar',
  standalone: true,
  imports: [NgIf, FormsModule, MatFormFieldModule, MatInputModule, CnButtonModule, LdgFilterChipsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ldg-filters ldg-row--between" role="toolbar" aria-label="Exception filters and bulk decisions">
      <div class="ldg-filters__group">
        <span class="ldg-filters__label">Reason</span>
        <ldg-filter-chips [chips]="reasonChips" [multiple]="true" ariaLabel="Exception reason" [ngModel]="reasonFilter" (selectionChange)="reasonFilterChange.emit($event)"></ldg-filter-chips>
      </div>
      <div class="ldg-row" *ngIf="canDecide">
        <span class="ldg-muted" aria-live="polite">{{ selectedCount }} selected</span>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="ldg-decision-bar__note">
          <mat-label>Note (optional)</mat-label>
          <input matInput [(ngModel)]="note" maxlength="120" [disabled]="!selectedCount">
        </mat-form-field>
        <cn-button variant="secondary" icon="cn:check" [disabled]="!selectedCount || busy" (pressed)="emit('pay')">Pay selected</cn-button>
        <cn-button variant="destructive" icon="cn:close" [disabled]="!selectedCount || busy" (pressed)="emit('return')">Return selected</cn-button>
      </div>
    </div>
  `,
  styles: [`.ldg-decision-bar__note { width: 220px; }`]
})
export class ExceptionDecisionBarComponent {
  @Input() reasonFilter: ExceptionReason[] = [];
  @Input() selectedCount = 0;
  @Input() canDecide = false;
  @Input() busy = false;
  @Output() readonly reasonFilterChange = new EventEmitter<ExceptionReason[]>();
  @Output() readonly decide = new EventEmitter<BulkDecision>();

  readonly reasonChips = REASON_CHIPS;
  note = '';

  emit(decision: 'pay' | 'return'): void {
    this.decide.emit({ decision, note: this.note.trim() || undefined });
    this.note = '';
  }
}
