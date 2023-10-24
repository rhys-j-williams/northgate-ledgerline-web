import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CnColumn, CnDataTableModule } from '@meridian/canopy-ui/data-display';

import { PaymentApproval } from '../../core/models/payment-approval';
import { CutoffCountdownComponent, StatusBadgeComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { ApprovalRiskFlagsComponent } from './approval-risk-flags.component';

@Component({
  selector: 'ldg-approvals-table',
  standalone: true,
  imports: [NgIf, DatePipe, CnDataTableModule, StatusBadgeComponent, CutoffCountdownComponent, MinorAmountPipe, ApprovalRiskFlagsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approvals-table.component.html'
})
export class ApprovalsTableComponent {
  @Input({ required: true }) rows: PaymentApproval[] = [];
  @Input() decidingId: string | null = null;
  @Output() readonly openApproval = new EventEmitter<PaymentApproval>();

  readonly columns: CnColumn<PaymentApproval>[] = [
    { key: 'beneficiaryName', header: 'Beneficiary', type: 'template', sortable: true },
    { key: 'rail', header: 'Rail', type: 'template', width: '110px' },
    { key: 'amountMinor', header: 'Amount', type: 'template', align: 'end', sortable: true, width: '160px' },
    { key: 'debitAccountNickname', header: 'From account', type: 'text' },
    { key: 'cutoffAt', header: 'Cutoff', type: 'template', sortable: true, width: '190px' },
    { key: 'approvalsGiven', header: 'Approvals', type: 'template', align: 'center', width: '110px' },
    { key: 'status', header: 'Status', type: 'template', width: '120px' }
  ];

  trackById = (_: number, row: PaymentApproval): string => row.approvalId;

  rowClass = (row: PaymentApproval): string =>
    [row.urgency === 'cutoff-at-risk' ? 'ldg-approvals__row--at-risk' : '', row.approvalId === this.decidingId ? 'ldg-approvals__row--busy' : '']
      .filter(Boolean).join(' ');
}
