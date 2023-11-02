import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CnColumn, CnDataTableModule } from '@meridian/canopy-ui/data-display';

import { LiquidityPosition } from '../../core/models/liquidity';
import { StatusBadgeComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { TitleCaseTokenPipe } from '../../shared/pipes/title-case-token.pipe';
import { BalanceView } from './dashboard-filters.store';

@Component({
  selector: 'ldg-positions-table',
  standalone: true,
  imports: [NgIf, CnDataTableModule, StatusBadgeComponent, MinorAmountPipe, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-data-table [columns]="columns" [rows]="positions" caption="Account positions" density="compact" [showPaginator]="false"
                   [trackBy]="trackById" emptyText="No positions match the filters">
      <ng-template cnColumnDef="nickname" let-row>
        <div>
          <span>{{ row.nickname }}</span>
          <span class="ldg-muted ldg-num ldg-positions__sub">{{ row.accountNumberMasked }}</span>
        </div>
      </ng-template>
      <ng-template cnColumnDef="bucket" let-row>
        <ldg-status-badge [status]="row.bucket" [label]="row.bucket | titleCaseToken" size="small"></ldg-status-badge>
      </ng-template>
      <ng-template cnColumnDef="balance" let-row>
        <span class="ldg-num">{{ (view === 'ledger' ? row.ledgerBalanceMinor : row.availableBalanceMinor) | minorAmount:row.currency }}</span>
      </ng-template>
      <ng-template cnColumnDef="intradayNetMinor" let-row>
        <span class="ldg-num" [class.ldg-positive]="row.intradayNetMinor > 0" [class.ldg-negative]="row.intradayNetMinor < 0">{{ row.intradayNetMinor | minorAmount:row.currency:'signed' }}</span>
      </ng-template>
      <ng-template cnColumnDef="targetBalanceMinor" let-row>
        <span class="ldg-num" *ngIf="row.targetBalanceMinor !== null; else noTarget">{{ row.targetBalanceMinor | minorAmount:row.currency }}</span>
        <ng-template #noTarget><span class="ldg-muted">—</span></ng-template>
      </ng-template>
    </cn-data-table>
  `,
  styles: [`.ldg-positions__sub { display: block; font-size: 12px; }`]
})
export class PositionsTableComponent {
  @Input({ required: true }) positions: LiquidityPosition[] = [];
  @Input() view: BalanceView = 'available';

  readonly columns: CnColumn<LiquidityPosition>[] = [
    { key: 'nickname', header: 'Account', type: 'template', sortable: true },
    { key: 'bucket', header: 'Bucket', type: 'template', width: '140px' },
    { key: 'currency', header: 'Ccy', type: 'text', width: '70px' },
    { key: 'balance', header: 'Balance', type: 'template', align: 'end', accessor: row => this.view === 'ledger' ? row.ledgerBalanceMinor : row.availableBalanceMinor, sortable: true },
    { key: 'intradayNetMinor', header: 'Intraday', type: 'template', align: 'end', sortable: true },
    { key: 'targetBalanceMinor', header: 'Sweep target', type: 'template', align: 'end' }
  ];

  trackById = (_: number, row: LiquidityPosition): string => row.accountId;
}
