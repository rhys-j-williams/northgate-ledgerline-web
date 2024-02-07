import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CnButtonModule } from '@meridian/canopy-ui/actions';

import { SessionStore } from '../../core/auth/session.store';
import { PositivePayException } from '../../core/models/positive-pay';
import { StatusBadgeComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { TitleCaseTokenPipe } from '../../shared/pipes/title-case-token.pipe';

@Component({
  selector: 'ldg-exception-detail-dialog',
  standalone: true,
  imports: [NgIf, DatePipe, MatDialogModule, CnButtonModule, StatusBadgeComponent, MinorAmountPipe, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Cheque #{{ item.checkSerial }} <ldg-status-badge [status]="item.reason" [label]="item.reason | titleCaseToken" size="small"></ldg-status-badge></h2>
    <mat-dialog-content>
      <table class="ldg-compare" aria-label="Presented versus issued">
        <thead><tr><th scope="col"></th><th scope="col">Presented</th><th scope="col">Issued</th></tr></thead>
        <tbody>
          <tr><th scope="row">Amount</th><td class="ldg-num">{{ item.presentedAmountMinor | minorAmount:'USD' }}</td><td class="ldg-num" [class.ldg-negative]="item.issuedAmountMinor !== item.presentedAmountMinor">{{ item.issuedAmountMinor !== null ? (item.issuedAmountMinor | minorAmount:'USD') : 'not on file' }}</td></tr>
          <tr><th scope="row">Payee</th><td>{{ item.presentedPayee }}</td><td [class.ldg-negative]="item.issuedPayee !== item.presentedPayee">{{ item.issuedPayee ?? 'not on file' }}</td></tr>
          <tr><th scope="row">Account</th><td colspan="2">{{ item.accountNickname }}</td></tr>
          <tr><th scope="row">Presented</th><td colspan="2">{{ item.presentedAt | date:'medium' }}</td></tr>
        </tbody>
      </table>
      <p class="ldg-muted" *ngIf="!item.imageAvailable">Cheque image not yet available from the lockbox. Images arrive within 30 minutes of presentment (LDG-1408).</p>
      <p class="ldg-muted" *ngIf="item.imageAvailable">Cheque image available; the viewer opens in the imaging portal.</p>
      <p *ngIf="item.decision">Decided <strong>{{ item.decision }}</strong> by {{ item.decidedBy }} at {{ item.decidedAt | date:'medium' }}.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <cn-button variant="tertiary" (pressed)="ref.close()">Close</cn-button>
      <ng-container *ngIf="!item.decision && canDecide">
        <cn-button variant="destructive" (pressed)="ref.close('return')">Return</cn-button>
        <cn-button variant="primary" (pressed)="ref.close('pay')">Pay</cn-button>
      </ng-container>
    </mat-dialog-actions>
  `,
  styles: [`
    .ldg-compare { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .ldg-compare th, .ldg-compare td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--cn-color-border); }
    .ldg-compare thead th { font-size: 12px; color: var(--cn-color-text-muted); text-transform: uppercase; }
  `]
})
export class ExceptionDetailDialogComponent {
  readonly item = inject<PositivePayException>(MAT_DIALOG_DATA);
  readonly ref = inject<MatDialogRef<ExceptionDetailDialogComponent, 'pay' | 'return' | undefined>>(MatDialogRef);
  readonly canDecide = inject(SessionStore).can('positive-pay:decide');
}
