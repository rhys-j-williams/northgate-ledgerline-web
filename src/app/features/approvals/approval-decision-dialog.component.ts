import { NgIf, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CnButtonModule } from '@meridian/canopy-ui/actions';

import { PaymentApproval } from '../../core/models/payment-approval';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';

export interface ApprovalDecisionDialogData {
  approval: PaymentApproval;
  decision: 'approve' | 'reject';
}

export interface ApprovalDecisionDialogResult {
  confirmed: boolean;
  reason?: string;
}

/** Rejections need a reason (it goes to the initiator and the audit log); approvals do not. */
@Component({
  selector: 'ldg-approval-decision-dialog',
  standalone: true,
  imports: [NgIf, UpperCasePipe, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, CnButtonModule, MinorAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.decision === 'approve' ? 'Approve payment' : 'Reject payment' }}</h2>
    <mat-dialog-content>
      <p>
        {{ data.approval.amountMinor | minorAmount:data.approval.currency }} to <strong>{{ data.approval.beneficiaryName }}</strong>
        from {{ data.approval.debitAccountNickname }} by {{ data.approval.rail | uppercase }}.
      </p>
      <p *ngIf="data.decision === 'approve' && data.approval.riskFlags.length" class="ldg-negative">
        The fraud screen flagged this payment. Approving records that you reviewed the flags.
      </p>
      <mat-form-field *ngIf="data.decision === 'reject'" appearance="outline" class="ldg-decision__reason">
        <mat-label>Reason for rejection</mat-label>
        <textarea matInput [formControl]="reason" rows="3" maxlength="240" required></textarea>
        <mat-hint align="end">{{ reason.value.length }}/240</mat-hint>
        <mat-error *ngIf="reason.hasError('required')">A reason is required</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <cn-button variant="tertiary" (pressed)="ref.close({ confirmed: false })">Cancel</cn-button>
      <cn-button [variant]="data.decision === 'approve' ? 'primary' : 'destructive'" [disabled]="data.decision === 'reject' && reason.invalid"
                 (pressed)="confirm()">{{ data.decision === 'approve' ? 'Approve' : 'Reject' }}</cn-button>
    </mat-dialog-actions>
  `,
  styles: [`.ldg-decision__reason { width: 100%; }`]
})
export class ApprovalDecisionDialogComponent {
  readonly data = inject<ApprovalDecisionDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject<MatDialogRef<ApprovalDecisionDialogComponent, ApprovalDecisionDialogResult>>(MatDialogRef);
  readonly reason = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(240)] });

  confirm(): void {
    if (this.data.decision === 'reject' && this.reason.invalid) {
      this.reason.markAsTouched();
      return;
    }
    this.ref.close({ confirmed: true, reason: this.data.decision === 'reject' ? this.reason.value.trim() : undefined });
  }
}
