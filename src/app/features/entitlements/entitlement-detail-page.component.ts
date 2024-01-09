import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { CnCardModule } from '@meridian/canopy-ui/data-display';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';
import type { Entitlement } from '@meridian/domain-fixtures';

import { EntitlementLimitUpdate, EntitlementsApi } from '../../core/api/entitlements.api';
import { SessionStore } from '../../core/auth/session.store';
import { ApiError } from '../../core/http/api-error';
import { NotificationService } from '../../core/notification.service';
import { ErrorStateComponent, LoadingStateComponent, StatusBadgeComponent } from '../../shared/components';
import { EntitlementLimitsFormComponent } from './entitlement-limits-form.component';
import { PermissionListComponent } from './permission-list.component';

@Component({
  selector: 'ldg-entitlement-detail-page',
  standalone: true,
  imports: [
    NgIf, CnPageHeaderModule, CnCardModule, StatusBadgeComponent, PermissionListComponent,
    EntitlementLimitsFormComponent, LoadingStateComponent, ErrorStateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ldg-loading-state *ngIf="loading()" [rows]="4"></ldg-loading-state>
    <ldg-error-state *ngIf="error() as err" [error]="err" (retry)="load()"></ldg-error-state>
    <ng-container *ngIf="entitlement() as e">
      <cn-page-header [title]="e.userHandle" [eyebrow]="e.entitlementId" [compact]="true" backLink="/entitlements" backLabel="All entitlements">
        <ldg-status-badge [status]="e.role" [label]="e.role"></ldg-status-badge>
      </cn-page-header>
      <div class="ldg-grid">
        <cn-card title="Permissions" subtitle="Granted by role; the catalogue is owned by entitlements-service">
          <ldg-permission-list [permissions]="e.permissions"></ldg-permission-list>
        </cn-card>
        <cn-card title="Limits" [subtitle]="canEdit() ? 'Changes are logged and take effect at next sign in' : 'Read only for your role'">
          <ldg-entitlement-limits-form [entitlement]="e" [readonly]="!canEdit()" [saving]="saving()" (save)="save($event)"></ldg-entitlement-limits-form>
        </cn-card>
      </div>
    </ng-container>
  `
})
export class EntitlementDetailPageComponent implements OnInit {
  @Input({ required: true }) entitlementId = '';

  private readonly api = inject(EntitlementsApi);
  private readonly session = inject(SessionStore);
  private readonly notify = inject(NotificationService);

  protected readonly entitlement = signal<Entitlement | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly canEdit = computed(() => this.session.canAny('entitlements:manage', 'users:manage'));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(this.entitlementId).subscribe({
      next: e => {
        this.entitlement.set(e);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      }
    });
  }

  save(update: EntitlementLimitUpdate): void {
    this.saving.set(true);
    this.api.updateLimits(this.entitlementId, update).subscribe({
      next: e => {
        this.entitlement.set(e);
        this.saving.set(false);
        this.notify.success('Limits updated');
      },
      error: () => this.saving.set(false)
    });
  }
}
