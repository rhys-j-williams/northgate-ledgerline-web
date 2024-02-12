import { TestBed } from '@angular/core/testing';

import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { BulkDecision, ExceptionDecisionBarComponent } from './exception-decision-bar.component';

describe('ExceptionDecisionBarComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideFixtureBackend() }));

  it('emits decisions with the trimmed note and clears it', () => {
    const fixture = TestBed.createComponent(ExceptionDecisionBarComponent);
    const decisions: BulkDecision[] = [];
    fixture.componentInstance.decide.subscribe(d => decisions.push(d));
    fixture.componentRef.setInput('canDecide', true);
    fixture.componentRef.setInput('selectedCount', 2);
    fixture.detectChanges();
    fixture.componentInstance.note = '  looks fine ';
    fixture.componentInstance.emit('pay');
    fixture.componentInstance.emit('return');
    expect(decisions).toEqual([{ decision: 'pay', note: 'looks fine' }, { decision: 'return', note: undefined }]);
    expect(fixture.nativeElement.textContent).toContain('2 selected');
    expect(fixture.componentInstance.reasonChips.map(c => c.value)).toContain('stale-dated');
  });
});
