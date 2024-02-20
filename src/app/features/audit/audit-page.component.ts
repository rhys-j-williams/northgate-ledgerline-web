import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';
import { finalize } from 'rxjs';

import { AuditApi } from '../../core/api/audit.api';
import { APP_CONFIG } from '../../core/config/app-config';
import { ApiError } from '../../core/http/api-error';
import { AuditEvent, AuditQuery } from '../../core/models/audit';
import { EmptyStateComponent, ErrorStateComponent, LoadingStateComponent } from '../../shared/components';
import { AuditEventDetailComponent } from './audit-event-detail.component';
import { AuditExportButtonComponent } from './audit-export-button.component';
import { AuditFiltersComponent } from './audit-filters.component';
import { AuditTableComponent } from './audit-table.component';

const PAGE_SIZE = 50;

@Component({
  selector: 'ldg-audit-page',
  standalone: true,
  imports: [
    NgIf, CnPageHeaderModule, AuditFiltersComponent, AuditTableComponent, AuditExportButtonComponent,
    AuditEventDetailComponent, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-page.component.html',
  styles: [`
    .ldg-audit__layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--ldg-grid-gap); }
    .ldg-audit__layout--with-detail { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
    @media (max-width: 1000px) { .ldg-audit__layout--with-detail { grid-template-columns: 1fr; } }
  `]
})
export class AuditPageComponent {
  private readonly api = inject(AuditApi);
  protected readonly exportEnabled = inject(APP_CONFIG).featureFlags.auditExport;

  protected readonly query = signal<AuditQuery>({});
  protected readonly page = signal(0);
  protected readonly events = signal<AuditEvent[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly selected = signal<AuditEvent | null>(null);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  constructor() {
    // Re-query whenever filters or page change. untracked() around the request so signal writes
    // inside the subscribe do not re-trigger the effect.
    effect(() => {
      const query = this.query();
      const page = this.page();
      untracked(() => this.search(query, page));
    });
  }

  onQuery(query: AuditQuery): void {
    this.page.set(0);
    this.selected.set(null);
    this.query.set(query);
  }

  retry(): void {
    this.search(this.query(), this.page());
  }

  private search(query: AuditQuery, page: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.search(query, page, PAGE_SIZE).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: result => {
        this.events.set(result.events);
        this.total.set(result.total);
      },
      error: (err: ApiError) => this.error.set(err)
    });
  }
}
