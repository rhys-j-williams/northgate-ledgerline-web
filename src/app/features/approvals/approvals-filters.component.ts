import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { LdgFilterChip, LdgFilterChipsComponent } from '../../canopy-compat';
import { ApprovalStatus, PaymentRail } from '../../core/models/payment-approval';
import { ApprovalSort, ApprovalsStore } from './approvals.store';

const STATUS_CHIPS: LdgFilterChip<ApprovalStatus>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'released', label: 'Released' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' }
];

@Component({
  selector: 'ldg-approvals-filters',
  standalone: true,
  imports: [NgFor, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, LdgFilterChipsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approvals-filters.component.html'
})
export class ApprovalsFiltersComponent {
  protected readonly store = inject(ApprovalsStore);
  protected readonly statusChips = STATUS_CHIPS;
  protected readonly sortOptions: { value: ApprovalSort; label: string }[] = [
    { value: 'cutoff', label: 'Soonest cutoff' },
    { value: 'amount', label: 'Largest amount' },
    { value: 'initiated', label: 'Most recent' }
  ];

  protected readonly railChips = computed<LdgFilterChip<PaymentRail>[]>(() => {
    const counts = this.store.railCounts();
    return [
      { value: 'wire', label: 'Wire', count: counts.wire },
      { value: 'ach', label: 'ACH', count: counts.ach },
      { value: 'rtp', label: 'RTP', count: counts.rtp },
      { value: 'book-transfer', label: 'Book transfer', count: counts['book-transfer'] }
    ];
  });

  onStatus(values: ApprovalStatus[]): void {
    this.store.statusFilter.set(values);
  }

  onRail(values: PaymentRail[]): void {
    this.store.railFilter.set(values);
  }
}
