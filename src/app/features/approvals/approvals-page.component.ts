import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';

import { PaymentApproval } from '../../core/models/payment-approval';
import { EmptyStateComponent, ErrorStateComponent, KpiTileComponent, LoadingStateComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { ApprovalsFiltersComponent } from './approvals-filters.component';
import { ApprovalsTableComponent } from './approvals-table.component';
import { ApprovalsStore } from './approvals.store';

@Component({
  selector: 'ldg-approvals-page',
  standalone: true,
  imports: [
    NgIf, CnPageHeaderModule, CnButtonModule, ApprovalsFiltersComponent, ApprovalsTableComponent,
    LoadingStateComponent, EmptyStateComponent, ErrorStateComponent, KpiTileComponent, MinorAmountPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approvals-page.component.html'
})
export class ApprovalsPageComponent implements OnInit {
  protected readonly store = inject(ApprovalsStore);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.store.load();
  }

  open(approval: PaymentApproval): void {
    void this.router.navigate(['/approvals', approval.approvalId]);
  }
}
