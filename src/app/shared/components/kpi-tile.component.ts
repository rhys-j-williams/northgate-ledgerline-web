import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CnCardModule } from '@meridian/canopy-ui/data-display';

@Component({
  selector: 'ldg-kpi-tile',
  standalone: true,
  imports: [NgIf, CnCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-card class="ldg-kpi" [flat]="true" [padded]="true" [highlight]="highlight">
      <span class="ldg-kpi__label">{{ label }}</span>
      <span class="ldg-kpi__value ldg-num" [class.ldg-positive]="trend === 'up'" [class.ldg-negative]="trend === 'down'">{{ value }}</span>
      <span class="ldg-kpi__hint ldg-muted" *ngIf="hint">{{ hint }}</span>
    </cn-card>
  `,
  styles: [`
    .ldg-kpi { display: block; }
    .ldg-kpi__label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--cn-color-text-muted); }
    .ldg-kpi__value { display: block; font-size: 26px; font-weight: 600; margin: 4px 0; }
    .ldg-kpi__hint { display: block; font-size: 12px; }
  `]
})
export class KpiTileComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input() hint: string | null = null;
  @Input() trend: 'up' | 'down' | 'flat' = 'flat';
  @Input() highlight = false;
}
