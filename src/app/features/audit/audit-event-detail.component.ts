import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CnIconButtonModule } from '@meridian/canopy-ui/actions';
import { CnCardModule } from '@meridian/canopy-ui/data-display';

import { AuditEvent } from '../../core/models/audit';
import { StatusBadgeComponent } from '../../shared/components';

@Component({
  selector: 'ldg-audit-event-detail',
  standalone: true,
  imports: [NgIf, DatePipe, CnCardModule, CnIconButtonModule, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-card [title]="event.action" [subtitle]="event.occurredAt | date:'medium'" class="ldg-audit-detail" role="region" aria-label="Event detail">
      <cn-icon-button cnCardAction icon="cn:close" ariaLabel="Close detail" (pressed)="closed.emit()"></cn-icon-button>
      <dl class="ldg-dl">
        <dt>Outcome</dt><dd><ldg-status-badge [status]="event.outcome" [dot]="true"></ldg-status-badge></dd>
        <dt>Actor</dt><dd>{{ event.actor }} <span class="ldg-muted">({{ event.actorRole }})</span></dd>
        <dt>Subject</dt><dd>{{ event.subjectType }} <code>{{ event.subjectId }}</code></dd>
        <dt>Correlation</dt><dd><code>{{ event.correlationId }}</code></dd>
        <dt>Source IP</dt><dd class="ldg-num">{{ event.sourceIp }}</dd>
        <dt *ngIf="event.detail">Detail</dt><dd *ngIf="event.detail">{{ event.detail }}</dd>
        <dt>Event id</dt><dd><code>{{ event.eventId }}</code></dd>
      </dl>
      <p class="ldg-muted ldg-audit-detail__foot">Search the correlation id in Splunk (index=treasury_bff) for the server side of this event.</p>
    </cn-card>
  `,
  styles: [`
    .ldg-audit-detail { display: block; position: sticky; top: 16px; }
    .ldg-audit-detail__foot { font-size: 12px; margin: 12px 0 0; }
  `]
})
export class AuditEventDetailComponent {
  @Input({ required: true }) event!: AuditEvent;
  @Output() readonly closed = new EventEmitter<void>();
}
