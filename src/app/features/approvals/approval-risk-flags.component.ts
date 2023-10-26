import { NgFor } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TitleCaseTokenPipe } from '../../shared/pipes/title-case-token.pipe';

const DESCRIPTIONS: Record<string, string> = {
  'new-beneficiary': 'First payment to this beneficiary from this organisation',
  'amount-above-profile': 'Amount is outside the 90-day profile for this account',
  'velocity': 'Several payments to the same beneficiary in a short window',
  'sanctions-review': 'Name screening returned a possible match; compliance has been notified'
};

@Component({
  selector: 'ldg-approval-risk-flags',
  standalone: true,
  imports: [NgFor, MatIconModule, MatTooltipModule, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="ldg-risk-flags" [class.ldg-risk-flags--compact]="compact" aria-label="Fraud screen flags">
      <li *ngFor="let flag of flags" class="ldg-risk-flags__item" [matTooltip]="describe(flag)">
        <mat-icon svgIcon="cn:alert" aria-hidden="true"></mat-icon>
        <span [class.cdk-visually-hidden]="compact">{{ flag | titleCaseToken }}</span>
      </li>
    </ul>
  `,
  styles: [`
    .ldg-risk-flags { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; margin: 4px 0 0; padding: 0; }
    .ldg-risk-flags__item { display: inline-flex; align-items: center; gap: 4px; color: var(--ldg-color-cutoff); font-size: 12px; }
    .ldg-risk-flags__item .mat-icon { width: 16px; height: 16px; font-size: 16px; }
    .ldg-risk-flags--compact { gap: 2px; }
  `]
})
export class ApprovalRiskFlagsComponent {
  @Input({ required: true }) flags: string[] = [];
  @Input({ transform: booleanAttribute }) compact = false;

  describe(flag: string): string {
    return DESCRIPTIONS[flag] ?? flag;
  }
}
