import { ChangeDetectionStrategy, Component, inject, Input, signal } from '@angular/core';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import { finalize } from 'rxjs';

import { AuditApi } from '../../core/api/audit.api';
import { AuditQuery } from '../../core/models/audit';
import { NotificationService } from '../../core/notification.service';

/** CSV export of the current date range. Capped at 10k rows by the BFF; larger pulls go through the reporting team. */
@Component({
  selector: 'ldg-audit-export-button',
  standalone: true,
  imports: [CnButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-button variant="secondary" icon="cn:download" [loading]="busy()" [disabled]="!total" (pressed)="export()"
               [attr.title]="total > 10000 ? 'Export is capped at 10,000 rows; narrow the range' : null">Export CSV</cn-button>
  `
})
export class AuditExportButtonComponent {
  @Input() query: AuditQuery = {};
  @Input() total = 0;

  private readonly api = inject(AuditApi);
  private readonly notify = inject(NotificationService);
  protected readonly busy = signal(false);

  export(): void {
    this.busy.set(true);
    this.api.exportCsv(this.query).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `ledgerline-audit-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.notify.info('Export started');
      }
    });
  }
}
