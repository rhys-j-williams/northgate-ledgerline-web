import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ApprovalsApi } from '../../core/api/approvals.api';
import { ApiError } from '../../core/http/api-error';
import { ApprovalDecision, ApprovalStatus, PaymentApproval, PaymentRail } from '../../core/models/payment-approval';

export type ApprovalSort = 'cutoff' | 'amount' | 'initiated';

/**
 * Approvals queue state. One instance for the app: the nav badge in the shell reads
 * `pendingCount` from here, so a decision on the detail page updates the badge without another
 * round trip.
 *
 * Filters are signals rather than a FormGroup because nothing here is a form; they are view state.
 * Persisting them to the URL was tried and reverted (LDG-1211), the query strings leaked into
 * approval emails.
 */
@Injectable({ providedIn: 'root' })
export class ApprovalsStore {
  private readonly api = inject(ApprovalsApi);

  private readonly approvalsSignal = signal<PaymentApproval[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<ApiError | null>(null);
  private readonly decidingSignal = signal<string | null>(null);

  readonly statusFilter = signal<ApprovalStatus[]>(['pending']);
  readonly railFilter = signal<PaymentRail[]>([]);
  readonly search = signal('');
  readonly sort = signal<ApprovalSort>('cutoff');

  readonly approvals = this.approvalsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly deciding = this.decidingSignal.asReadonly();

  readonly pendingCount = computed(() => this.approvalsSignal().filter(a => a.status === 'pending').length);
  readonly cutoffAtRiskCount = computed(() =>
    this.approvalsSignal().filter(a => a.status === 'pending' && a.urgency === 'cutoff-at-risk').length);
  readonly pendingTotalMinor = computed(() =>
    this.approvalsSignal().filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amountMinor, 0));

  readonly visible = computed(() => {
    const statuses = this.statusFilter();
    const rails = this.railFilter();
    const needle = this.search().trim().toLowerCase();
    const rows = this.approvalsSignal().filter(a =>
      (!statuses.length || statuses.includes(a.status))
      && (!rails.length || rails.includes(a.rail))
      && (!needle || [a.beneficiaryName, a.debitAccountNickname, a.paymentId, a.initiatedBy].some(v => v.toLowerCase().includes(needle))));
    return sortApprovals(rows, this.sort());
  });

  readonly railCounts = computed(() => {
    const counts: Record<PaymentRail, number> = { wire: 0, ach: 0, rtp: 0, 'book-transfer': 0 };
    for (const a of this.approvalsSignal()) {
      if (a.status === 'pending') counts[a.rail] += 1;
    }
    return counts;
  });

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.list().pipe(finalize(() => this.loadingSignal.set(false))).subscribe({
      next: rows => this.approvalsSignal.set(rows),
      error: (err: ApiError) => this.errorSignal.set(err)
    });
  }

  /** Cheap refresh for the shell badge; does not touch loading/error so a page in flight is not disturbed. */
  refreshCount(): void {
    if (this.approvalsSignal().length) {
      return;
    }
    this.api.list({ status: ['pending'] }).subscribe({
      next: rows => this.approvalsSignal.update(existing => existing.length ? existing : rows),
      error: () => undefined
    });
  }

  byId(approvalId: string): PaymentApproval | undefined {
    return this.approvalsSignal().find(a => a.approvalId === approvalId);
  }

  decide(decision: ApprovalDecision): Promise<void> {
    this.decidingSignal.set(decision.approvalId);
    return new Promise((resolve, reject) => {
      this.api.decide(decision).pipe(finalize(() => this.decidingSignal.set(null))).subscribe({
        next: result => {
          this.approvalsSignal.update(rows => rows.map(a => a.approvalId === result.approvalId
            ? { ...a, status: result.status, approvalsGiven: result.approvalsGiven }
            : a));
          resolve();
        },
        error: (err: ApiError) => reject(err)
      });
    });
  }

  clearFilters(): void {
    this.statusFilter.set(['pending']);
    this.railFilter.set([]);
    this.search.set('');
  }
}

function sortApprovals(rows: PaymentApproval[], sort: ApprovalSort): PaymentApproval[] {
  const copy = [...rows];
  switch (sort) {
    case 'amount':
      return copy.sort((a, b) => b.amountMinor - a.amountMinor);
    case 'initiated':
      return copy.sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
    default:
      return copy.sort((a, b) => a.cutoffAt.localeCompare(b.cutoffAt));
  }
}
