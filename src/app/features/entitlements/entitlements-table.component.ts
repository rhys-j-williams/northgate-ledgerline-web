import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CnColumn, CnDataTableModule } from '@meridian/canopy-ui/data-display';
import type { Entitlement } from '@meridian/domain-fixtures';

import { StatusBadgeComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { PermissionListComponent } from './permission-list.component';

@Component({
  selector: 'ldg-entitlements-table',
  standalone: true,
  imports: [NgIf, CnDataTableModule, StatusBadgeComponent, PermissionListComponent, MinorAmountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-data-table [columns]="columns" [rows]="rows" caption="User entitlements" [trackBy]="trackById" [pageSize]="25" (rowClick)="openEntitlement.emit($event)">
      <ng-template cnColumnDef="role" let-row>
        <ldg-status-badge [status]="row.role" [label]="row.role" size="small"></ldg-status-badge>
      </ng-template>
      <ng-template cnColumnDef="permissions" let-row>
        <ldg-permission-list [permissions]="row.permissions" [max]="3"></ldg-permission-list>
      </ng-template>
      <ng-template cnColumnDef="limitPerTransactionMinor" let-row>
        <span class="ldg-num" *ngIf="row.limitPerTransactionMinor !== undefined; else none">{{ row.limitPerTransactionMinor | minorAmount:'USD' }}</span>
      </ng-template>
      <ng-template cnColumnDef="limitPerDayMinor" let-row>
        <span class="ldg-num" *ngIf="row.limitPerDayMinor !== undefined; else none">{{ row.limitPerDayMinor | minorAmount:'USD' }}</span>
      </ng-template>
      <ng-template cnColumnDef="dualApprovalRequired" let-row>
        <ldg-status-badge [status]="row.dualApprovalRequired ? 'success' : 'denied'" [label]="row.dualApprovalRequired ? 'Dual' : 'Single'" size="small"></ldg-status-badge>
      </ng-template>
    </cn-data-table>
    <ng-template #none><span class="ldg-muted">—</span></ng-template>
  `
})
export class EntitlementsTableComponent {
  @Input({ required: true }) rows: Entitlement[] = [];
  @Output() readonly openEntitlement = new EventEmitter<Entitlement>();

  readonly columns: CnColumn<Entitlement>[] = [
    { key: 'userHandle', header: 'User', type: 'text', sortable: true },
    { key: 'role', header: 'Role', type: 'template', width: '130px', sortable: true },
    { key: 'permissions', header: 'Permissions', type: 'template' },
    { key: 'limitPerTransactionMinor', header: 'Per transaction', type: 'template', align: 'end', width: '150px' },
    { key: 'limitPerDayMinor', header: 'Per day', type: 'template', align: 'end', width: '150px' },
    { key: 'dualApprovalRequired', header: 'Approval', type: 'template', width: '100px' }
  ];

  trackById = (_: number, row: Entitlement): string => row.entitlementId;
}
