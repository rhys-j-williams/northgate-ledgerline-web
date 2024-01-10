import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import type { Entitlement } from '@meridian/domain-fixtures';

import { EntitlementLimitUpdate } from '../../core/api/entitlements.api';

/** Limits are entered in whole dollars and sent as minor units. Blank means "no limit", which is a deliberate value, not a validation failure. */
@Component({
  selector: 'ldg-entitlement-limits-form',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, CnButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="ldg-limits">
      <mat-form-field appearance="outline">
        <mat-label>Per transaction (USD)</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" inputmode="numeric" min="0" step="1000" formControlName="perTransaction" [readonly]="readonly">
        <mat-hint>Blank for no limit</mat-hint>
        <mat-error *ngIf="form.controls.perTransaction.hasError('min')">Must be zero or more</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Per day (USD)</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" inputmode="numeric" min="0" step="1000" formControlName="perDay" [readonly]="readonly">
        <mat-error *ngIf="form.hasError('dayBelowTransaction')">Daily limit cannot be below the per transaction limit</mat-error>
      </mat-form-field>
      <mat-checkbox formControlName="dualApproval" [disabled]="readonly">Require dual approval</mat-checkbox>
      <div class="ldg-row" *ngIf="!readonly">
        <cn-button type="submit" variant="primary" [loading]="saving" [disabled]="form.invalid || form.pristine">Save limits</cn-button>
        <cn-button variant="tertiary" [disabled]="form.pristine" (pressed)="reset()">Discard</cn-button>
      </div>
    </form>
  `,
  styles: [`.ldg-limits { display: grid; gap: 12px; max-width: 420px; }`]
})
export class EntitlementLimitsFormComponent implements OnChanges {
  @Input({ required: true }) entitlement!: Entitlement;
  @Input() readonly = false;
  @Input() saving = false;
  @Output() readonly save = new EventEmitter<EntitlementLimitUpdate>();

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    perTransaction: this.fb.control<number | null>(null, [Validators.min(0)]),
    perDay: this.fb.control<number | null>(null, [Validators.min(0)]),
    dualApproval: this.fb.control(true)
  }, {
    validators: group => {
      const tx = group.get('perTransaction')?.value as number | null;
      const day = group.get('perDay')?.value as number | null;
      return tx !== null && day !== null && day < tx ? { dayBelowTransaction: true } : null;
    }
  });

  ngOnChanges(): void {
    this.reset();
  }

  reset(): void {
    this.form.reset({
      perTransaction: this.entitlement.limitPerTransactionMinor === undefined ? null : this.entitlement.limitPerTransactionMinor / 100,
      perDay: this.entitlement.limitPerDayMinor === undefined ? null : this.entitlement.limitPerDayMinor / 100,
      dualApproval: this.entitlement.dualApprovalRequired
    });
  }

  submit(): void {
    if (this.form.invalid || this.readonly) return;
    const { perTransaction, perDay, dualApproval } = this.form.getRawValue();
    this.save.emit({
      limitPerTransactionMinor: perTransaction === null ? null : Math.round(perTransaction * 100),
      limitPerDayMinor: perDay === null ? null : Math.round(perDay * 100),
      dualApprovalRequired: dualApproval
    });
  }
}
