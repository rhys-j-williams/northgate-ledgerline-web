import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'ldg-empty-state',
  standalone: true,
  imports: [NgIf, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ldg-empty-state" role="status">
      <mat-icon [svgIcon]="icon" aria-hidden="true"></mat-icon>
      <h3 class="ldg-empty-state__title">{{ title }}</h3>
      <p class="ldg-empty-state__body" *ngIf="body">{{ body }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .ldg-empty-state { display: grid; justify-items: center; gap: 8px; padding: 40px 16px; text-align: center; color: var(--cn-color-text-muted); }
    .ldg-empty-state mat-icon { width: 40px; height: 40px; opacity: .6; }
    .ldg-empty-state__title { margin: 0; font-size: 16px; font-weight: 500; color: var(--cn-color-text); }
    .ldg-empty-state__body { margin: 0; max-width: 42ch; }
  `]
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input() body: string | null = null;
  @Input() icon = 'cn:check';
}
