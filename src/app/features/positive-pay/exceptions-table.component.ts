import { DatePipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CnColumn, CnDataTableModule, CnRowSelection } from '@meridian/canopy-ui/data-display';

import { PositivePayException } from '../../core/models/positive-pay';
import { CutoffCountdownComponent, StatusBadgeComponent } from '../../shared/components';
import { MinorAmountPipe } from '../../shared/pipes/minor-amount.pipe';
import { TitleCaseTokenPipe } from '../../shared/pipes/title-case-token.pipe';

@Component({
  selector: 'ldg-exceptions-table',
  standalone: true,
  imports: [NgIf, DatePipe, CnDataTableModule, StatusBadgeComponent, CutoffCountdownComponent, MinorAmountPipe, TitleCaseTokenPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-data-table [columns]="columns" [rows]="rows" caption="Positive pay exceptions" [trackBy]="trackById" [selectable]="selectable" [multiSelect]="selectable"
                   [pageSize]="25" (rowClick)="openException.emit($event)" (selectionChange)="onSelection($event)">
      <ng-template cnColumnDef="checkSerial" let-row>
        <span class="ldg-num">#{{ row.checkSerial }}</span>
        <span class="ldg-muted ldg-exceptions__sub">{{ row.accountNickname }}</span>
      </ng-template>
      <ng-template cnColumnDef="reason" let-row>
        <ldg-status-badge [status]="row.reason" [label]="row.reason | titleCaseToken" size="small"></ldg-status-badge>
      </ng-template>
      <ng-template cnColumnDef="presentedAmountMinor" let-row>
        <span class="ldg-num">{{ row.presentedAmountMinor | minorAmount:'USD' }}</span>
        <span class="ldg-muted ldg-exceptions__sub ldg-num" *ngIf="row.issuedAmountMinor !== null && row.issuedAmountMinor !== row.presentedAmountMinor">issued {{ row.issuedAmountMinor | minorAmount:'USD' }}</span>
      </ng-template>
      <ng-template cnColumnDef="presentedPayee" let-row>
        <span>{{ row.presentedPayee }}</span>
        <span class="ldg-muted ldg-exceptions__sub" *ngIf="row.issuedPayee && row.issuedPayee !== row.presentedPayee">issued to {{ row.issuedPayee }}</span>
      </ng-template>
      <ng-template cnColumnDef="decisionCutoffAt" let-row>
        <ldg-cutoff-countdown *ngIf="row.decision === undefined; else decided" [cutoffAt]="row.decisionCutoffAt"></ldg-cutoff-countdown>
        <ng-template #decided><span class="ldg-muted">{{ row.decidedAt | date:'MMM d, HH:mm' }}</span></ng-template>
      </ng-template>
      <ng-template cnColumnDef="decision" let-row>
        <ldg-status-badge *ngIf="row.decision; else undecided" [status]="row.decision" [dot]="true"></ldg-status-badge>
        <ng-template #undecided><ldg-status-badge status="pending" label="Undecided" [dot]="true"></ldg-status-badge></ng-template>
      </ng-template>
    </cn-data-table>
  `,
  styles: [`.ldg-exceptions__sub { display: block; font-size: 12px; }`]
})
export class ExceptionsTableComponent {
  @Input({ required: true }) rows: PositivePayException[] = [];
  @Input() selectable = false;
  @Output() readonly openException = new EventEmitter<PositivePayException>();
  @Output() readonly selectionChange = new EventEmitter<PositivePayException[]>();

  readonly columns: CnColumn<PositivePayException>[] = [
    { key: 'checkSerial', header: 'Cheque', type: 'template', sortable: true },
    { key: 'reason', header: 'Reason', type: 'template', width: '140px' },
    { key: 'presentedAmountMinor', header: 'Presented', type: 'template', align: 'end', sortable: true },
    { key: 'presentedPayee', header: 'Payee', type: 'template' },
    { key: 'decisionCutoffAt', header: 'Cutoff', type: 'template', width: '170px' },
    { key: 'decision', header: 'Decision', type: 'template', width: '120px' }
  ];

  trackById = (_: number, row: PositivePayException): string => row.exceptionId;

  onSelection(selection: CnRowSelection<PositivePayException>): void {
    this.selectionChange.emit(selection.selected);
  }
}
