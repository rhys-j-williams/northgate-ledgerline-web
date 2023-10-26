import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import { CnCardModule } from '@meridian/canopy-ui/data-display';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';
import { firstValueFrom } from 'rxjs';

import { ApprovalsApi } from '../../core/api/approvals.api';
import { SessionStore } from '../../core/auth/session.store';
import { ApiError } from '../../core/http/api-error';
import { PaymentApproval } from '../../core/models/payment-approval';
import { NotificationService } from '../../core/notification.service';
import { CutoffCountdownComponent, ErrorStateComponent, LoadingStateComponent, StatusBadgeComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ApprovalRiskFlagsComponent } from './approval-risk-flags.component';
import { ApprovalDecisionDialogComponent, ApprovalDecisionDialogData, ApprovalDecisionDialogResult } from './approval-decision-dialog.component';
import { ApprovalsStore } from './approvals.store';

@Component({
  selector: 'ldg-approval-detail-page',
  standalone: true,
  imports: [
    NgIf, NgFor, DatePipe, MatDialogModule, CnPageHeaderModule, CnCardModule, CnButtonModule,
    StatusBadgeComponent, CutoffCountdownComponent, LoadingStateComponent, ErrorStateComponent,
    ApprovalRiskFlagsComponent, MinorAmountPipe, RelativeTimePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approval-detail-page.component.html'
})
export class ApprovalDetailPageComponent implements OnInit {
  @Input({ required: true }) approvalId = '';

  private readonly api = inject(ApprovalsApi);
  private readonly store = inject(ApprovalsStore);
  private readonly session = inject(SessionStore);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly approval = signal<PaymentApproval | null>(null);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly loading = signal(true);

  protected readonly canApprove = computed(() => this.session.can('payments:approve'));
  /** Maker/checker: the initiator never approves their own payment, whatever their role says. */
  protected readonly isOwnPayment = computed(() => this.approval()?.initiatedBy === this.session.session()?.userHandle);
  protected readonly alreadyApproved = computed(() => {
    const me = this.session.session()?.userHandle;
    return !!me && !!this.approval()?.approvalsGiven.includes(me);
  });
  protected readonly decidable = computed(() =>
    this.approval()?.status === 'pending' && this.canApprove() && !this.isOwnPayment() && !this.alreadyApproved());
  protected readonly busy = computed(() => this.store.deciding() === this.approvalId);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const cached = this.store.byId(this.approvalId);
    if (cached) {
      this.approval.set(cached);
      this.loading.set(false);
    }
    this.api.get(this.approvalId).subscribe({
      next: approval => {
        this.approval.set(approval);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        if (!cached) this.error.set(err);
        this.loading.set(false);
      }
    });
  }

  async decide(decision: 'approve' | 'reject'): Promise<void> {
    const approval = this.approval();
    if (!approval) return;
    const data: ApprovalDecisionDialogData = { approval, decision };
    const result = await firstValueFrom(
      this.dialog.open<ApprovalDecisionDialogComponent, ApprovalDecisionDialogData, ApprovalDecisionDialogResult>(
        ApprovalDecisionDialogComponent, { data, width: '480px', ariaLabel: `${decision} payment` }
      ).afterClosed()
    );
    if (!result?.confirmed) return;
    try {
      await this.store.decide({ approvalId: approval.approvalId, decision, reason: result.reason });
      const updated = this.store.byId(approval.approvalId);
      if (updated) this.approval.set(updated);
      this.notify.success(decision === 'approve'
        ? (updated?.status === 'approved' ? 'Payment approved and queued for release' : 'Approval recorded; one more approver needed')
        : 'Payment rejected; the initiator has been notified');
      if (updated?.status !== 'pending') {
        void this.router.navigate(['/approvals']);
      }
    } catch {
      // errorInterceptor has already toasted; nothing more to say here.
    }
  }
}
