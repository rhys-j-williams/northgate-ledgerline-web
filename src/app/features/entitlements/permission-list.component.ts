import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'ldg-permission-list',
  standalone: true,
  imports: [NgFor, NgIf, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="ldg-perms" [attr.aria-label]="permissions.length + ' permissions'">
      <li *ngFor="let p of shown" class="ldg-perms__item"><code>{{ p }}</code></li>
      <li *ngIf="overflow.length" class="ldg-perms__item ldg-perms__more" [matTooltip]="overflow.join(', ')">+{{ overflow.length }} more</li>
    </ul>
  `,
  styles: [`
    .ldg-perms { display: flex; flex-wrap: wrap; gap: 4px; list-style: none; margin: 0; padding: 0; }
    .ldg-perms__item code { font-size: 12px; padding: 1px 6px; border-radius: 4px; background: var(--cn-color-surface-alt); }
    .ldg-perms__more { font-size: 12px; color: var(--cn-color-text-muted); align-self: center; }
  `]
})
export class PermissionListComponent {
  @Input({ required: true }) permissions: string[] = [];
  @Input() max = Infinity;

  get shown(): string[] {
    return this.permissions.slice(0, this.max);
  }

  get overflow(): string[] {
    return this.permissions.slice(this.max);
  }
}
