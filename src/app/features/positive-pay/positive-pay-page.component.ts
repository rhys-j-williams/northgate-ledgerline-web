import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';
import { finalize } from 'rxjs';

import { PositivePayApi } from '../../core/api/positive-pay.api';
import { SessionStore } from '../../core/auth/session.store';
import { APP_CONFIG } from '../../core/config/app-config';
import { ApiError } from '../../core/http/api-error';
import { ExceptionReason, PositivePayException } from '../../core/models/positive-pay';
import { NotificationService } from '../../core/notification.service';
import { EmptyStateComponent, ErrorStateComponent, KpiTileComponent, LoadingStateComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { ExceptionDecisionBarComponent } from './exception-decision-bar.component';
import { ExceptionDetailDialogComponent } from './exception-detail-dialog.component';
import { ExceptionsTableComponent } from './exceptions-table.component';

@Component({
  selector: 'ldg-positive-pay-page',
  standalone: true,
  imports: [
    NgIf, DatePipe, MatDialogModule, CnPageHeaderModule, ExceptionsTableComponent, ExceptionDecisionBarComponent,
    KpiTileComponent, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent, MinorAmountPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './positive-pay-page.component.html'
})
export class PositivePayPageComponent implements OnInit {
  private readonly api = inject(PositivePayApi);
  private readonly session = inject(SessionStore);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  protected readonly bulkEnabled = inject(APP_CONFIG).featureFlags.positivePayBulkDecision;

  protected readonly exceptions = signal<PositivePayException[]>([]);
  protected readonly loading = signal(true);
  protected readonly deciding = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly selected = signal<PositivePayException[]>([]);
  protected readonly reasonFilter = signal<ExceptionReason[]>([]);

  protected readonly canDecide = computed(() => this.session.can('positive-pay:decide'));
  protected readonly open = computed(() => this.exceptions().filter(e => e.decision === undefined));
  protected readonly openTotalMinor = computed(() => this.open().reduce((sum, e) => sum + e.presentedAmountMinor, 0));
  protected readonly nextCutoff = computed(() =>
    this.open().map(e => e.decisionCutoffAt).sort()[0] ?? null);
  protected readonly visible = computed(() => {
    const reasons = this.reasonFilter();
    return this.exceptions().filter(e => !reasons.length || reasons.includes(e.reason));
  });
  protected readonly selectedOpen = computed(() => this.selected().filter(e => e.decision === undefined));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: rows => {
        this.exceptions.set(rows);
        this.selected.set([]);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      }
    });
  }

  detail(exception: PositivePayException): void {
    this.dialog.open(ExceptionDetailDialogComponent, { data: exception, width: '560px' })
      .afterClosed().subscribe((decision: 'pay' | 'return' | undefined) => {
        if (decision && this.canDecide()) {
          this.decide([exception], decision);
        }
      });
  }

  decide(targets: PositivePayException[], decision: 'pay' | 'return', note?: string): void {
    const ids = targets.filter(e => e.decision === undefined).map(e => e.exceptionId);
    if (!ids.length) return;
    this.deciding.set(true);
    this.api.decide({ exceptionIds: ids, decision, note })
      .pipe(finalize(() => this.deciding.set(false)))
      .subscribe({
        next: updated => {
          const byId = new Map(updated.map(e => [e.exceptionId, e]));
          this.exceptions.update(rows => rows.map(r => byId.get(r.exceptionId) ?? r));
          this.selected.set([]);
          this.notify.success(`${ids.length} ${ids.length === 1 ? 'item' : 'items'} marked ${decision}`);
        }
      });
  }
}
