import { TestBed } from '@angular/core/testing';

import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { FxQuote } from '../../core/models/fx';
import { FxConverterComponent } from './fx-converter.component';

describe('FxConverterComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideFixtureBackend() }));

  it('multiplies the amount by bid and ask', () => {
    const fixture = TestBed.createComponent(FxConverterComponent);
    const quote: FxQuote = { pair: 'EURUSD', base: 'EUR', quote: 'USD', bid: 1.08, ask: 1.0804, mid: 1.0802, timestamp: '', source: 'tickerhaus' };
    fixture.componentRef.setInput('quote', quote);
    fixture.detectChanges();
    expect(fixture.componentInstance.atAsk()).toBeCloseTo(1_080_400);
    expect(fixture.componentInstance.atBid()).toBeCloseTo(1_080_000);
    fixture.componentInstance.amount.set(10);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('10.80');
    expect(fixture.nativeElement.textContent).toContain('Amount in EUR');
  });
});
