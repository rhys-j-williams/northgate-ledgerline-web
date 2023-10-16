import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import { ApiError } from '../../core/http/api-error';

@Component({
  selector: 'ldg-error-state',
  standalone: true,
  imports: [NgIf, CnButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ldg-error-state" role="alert">
      <h3 class="ldg-error-state__title">{{ title }}</h3>
      <p class="ldg-error-state__body">{{ message }}</p>
      <p class="ldg-error-state__ref" *ngIf="error?.correlationId">Reference {{ error?.correlationId }}</p>
      <cn-button variant="secondary" (pressed)="retry.emit()">Try again</cn-button>
    </div>
  `,
  styles: [`
    .ldg-error-state { display: grid; justify-items: start; gap: 8px; padding: 24px; border: 1px solid var(--cn-color-border-strong); border-left: 4px solid var(--cn-color-warn, #b3261e); border-radius: 8px; background: var(--cn-color-surface); }
    .ldg-error-state__title { margin: 0; font-size: 16px; }
    .ldg-error-state__body, .ldg-error-state__ref { margin: 0; color: var(--cn-color-text-muted); }
    .ldg-error-state__ref { font-family: var(--cn-font-family-mono, monospace); font-size: 12px; }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'We could not load this';
  @Input() error: ApiError | null = null;
  @Input() body: string | null = null;
  @Output() readonly retry = new EventEmitter<void>();

  get message(): string {
    if (this.body) {
      return this.body;
    }
    if (!this.error) {
      return 'The service did not respond. Try again in a moment.';
    }
    return this.error.status === 0
      ? 'You appear to be offline, or the bank is unreachable from this network.'
      : this.error.message;
  }
}
