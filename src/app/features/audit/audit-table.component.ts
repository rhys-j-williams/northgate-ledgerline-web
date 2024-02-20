import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CnIconButtonModule } from '@meridian/canopy-ui/actions';
import { CnColumn, CnDataTableModule } from '@meridian/canopy-ui/data-display';

import { AuditEvent } from '../../core/models/audit';
import { StatusBadgeComponent } from '../../shared/components';
import { TitleCaseTokenPipe } from '../../shared/pipes/title-case-token.pipe';

/** Server-side paging: the audit index is large and the BFF pages it; the table's own paginator is off. */
@Component({
  selector: 'ldg-audit-table',
  standalone: true,
  imports: [NgIf, DatePipe, CnDataTableModule, CnIconButtonModule, StatusBadgeComponent, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-data-table [columns]="columns" [rows]="rows" caption="Audit events" [trackBy]="trackById" [showPaginator]="false" [serverSide]="true"
                   [totalRows]="total" [loading]="loading" density="compact" [rowClass]="rowClass" (rowClick)="rowSelect.emit($event)">
      <ng-template cnColumnDef="occurredAt" let-row>
        <span class="ldg-num">{{ row.occurredAt | date:'yyyy-MM-dd HH:mm:ss' }}</span>
      </ng-template>
      <ng-template cnColumnDef="category" let-row>
        <ldg-status-badge [status]="row.category" [label]="row.category | titleCaseToken" size="small"></ldg-status-badge>
      </ng-template>
      <ng-template cnColumnDef="action" let-row>
        <code class="ldg-audit__action">{{ row.action }}</code>
      </ng-template>
      <ng-template cnColumnDef="outcome" let-row>
        <ldg-status-badge [status]="row.outcome" [dot]="true" size="small"></ldg-status-badge>
      </ng-template>
    </cn-data-table>
    <nav class="ldg-audit__pager ldg-row ldg-row--between" aria-label="Audit pages">
      <span class="ldg-muted">{{ rangeLabel }}</span>
      <span class="ldg-row">
        <cn-icon-button icon="cn:chevron-right" class="ldg-audit__prev" ariaLabel="Previous page" [disabled]="page === 0" (pressed)="pageChange.emit(page - 1)"></cn-icon-button>
        <span aria-current="page">Page {{ page + 1 }} of {{ pageCount }}</span>
        <cn-icon-button icon="cn:chevron-right" ariaLabel="Next page" [disabled]="page + 1 >= pageCount" (pressed)="pageChange.emit(page + 1)"></cn-icon-button>
      </span>
    </nav>
  `,
  styles: [`
    .ldg-audit__action { font-size: 12px; }
    .ldg-audit__pager { padding: 8px 4px; font-size: 13px; }
    .ldg-audit__prev { transform: rotate(180deg); }
  `]
})
export class AuditTableComponent {
  @Input({ required: true }) rows: AuditEvent[] = [];
  @Input() selectedId: string | null = null;
  @Input() loading = false;
  @Input() page = 0;
  @Input() pageCount = 1;
  @Input() total = 0;
  @Input() pageSize = 50;
  @Output() readonly rowSelect = new EventEmitter<AuditEvent>();
  @Output() readonly pageChange = new EventEmitter<number>();

  readonly columns: CnColumn<AuditEvent>[] = [
    { key: 'occurredAt', header: 'When', type: 'template', width: '170px', sortable: false },
    { key: 'category', header: 'Category', type: 'template', width: '130px', sortable: false },
    { key: 'action', header: 'Action', type: 'template', sortable: false },
    { key: 'actor', header: 'Actor', type: 'text', sortable: false },
    { key: 'subjectId', header: 'Subject', type: 'text', sortable: false },
    { key: 'outcome', header: 'Outcome', type: 'template', width: '110px', sortable: false }
  ];

  trackById = (_: number, row: AuditEvent): string => row.eventId;
  rowClass = (row: AuditEvent): string => row.eventId === this.selectedId ? 'ldg-audit__row--selected' : '';

  get rangeLabel(): string {
    if (!this.total) return 'No events';
    const start = this.page * this.pageSize + 1;
    const end = Math.min(this.total, start + this.rows.length - 1);
    return `${start}–${end} of ${this.total}`;
  }
}
