import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CnSkeletonModule } from '@meridian/canopy-ui/data-display';

@Component({
  selector: 'ldg-loading-state',
  standalone: true,
  imports: [NgFor, CnSkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ldg-loading-state" aria-busy="true" [attr.aria-label]="label">
      <cn-skeleton *ngFor="let _ of rowArray" [shape]="compact ? 'text' : 'row'"></cn-skeleton>
    </div>
  `,
  styles: [`.ldg-loading-state { display: grid; gap: 8px; padding: 8px 0; }`]
})
export class LoadingStateComponent {
  @Input() rows = 5;
  @Input() label = 'Loading';
  @Input() compact = false;

  get rowArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
