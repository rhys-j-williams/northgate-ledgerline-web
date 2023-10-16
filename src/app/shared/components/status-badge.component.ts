import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CnBadgeModule, CnBadgeTone } from '@meridian/canopy-ui/data-display';

import { TitleCaseTokenPipe } from '../pipes/title-case-token.pipe';

const TONES: Record<string, CnBadgeTone> = {
  pending: 'caution',
  approved: 'success',
  released: 'success',
  rejected: 'warn',
  expired: 'neutral',
  success: 'success',
  denied: 'warn',
  failure: 'warn',
  pay: 'success',
  return: 'warn',
  'cutoff-at-risk': 'warn',
  'same-day': 'caution',
  standard: 'neutral',
  wire: 'brand',
  ach: 'info',
  rtp: 'brand',
  'book-transfer': 'neutral'
};

/** One badge component for every status token in the app so the colour mapping lives in one place. */
@Component({
  selector: 'ldg-status-badge',
  standalone: true,
  imports: [CnBadgeModule, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<cn-badge [tone]="tone" [dot]="dot" [size]="size">{{ label ?? (status | titleCaseToken) }}</cn-badge>`
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';
  @Input() label: string | null = null;
  @Input() dot = false;
  @Input() size: 'default' | 'small' = 'default';

  get tone(): CnBadgeTone {
    return TONES[this.status] ?? 'neutral';
  }
}
