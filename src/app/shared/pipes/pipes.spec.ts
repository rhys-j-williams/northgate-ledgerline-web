import { TestBed } from '@angular/core/testing';
import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { MinorAmountPipe } from './minor-amount.pipe';
import { RelativeTimePipe } from './relative-time.pipe';
import { TitleCaseTokenPipe } from './title-case-token.pipe';

describe('MinorAmountPipe', () => {
  let pipe: MinorAmountPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    pipe = TestBed.runInInjectionContext(() => new MinorAmountPipe());
  });

  it('formats minor units as currency', () => {
    expect(pipe.transform(125_000_000)).toBe('$1,250,000.00');
    expect(pipe.transform(-1250)).toBe('-$12.50');
    expect(pipe.transform(1250, 'USD', 'signed')).toBe('+$12.50');
    expect(pipe.transform(-1250, 'USD', 'signed')).toBe('-$12.50');
  });

  it('compacts large numbers', () => {
    expect(pipe.transform(366_050_000_00, 'USD', 'compact')).toBe('$366.05m');
    expect(pipe.transform(2_500_000_000_00, 'USD', 'compact')).toBe('$2.50bn');
    expect(pipe.transform(173_040_00, 'USD', 'compact')).toBe('$173.0k');
    expect(pipe.transform(-9_99, 'USD', 'compact')).toBe('-$9.99');
    expect(pipe.transform(1_500_00, 'EUR', 'compact')).toBe('EUR 1.5k');
  });

  it('is blank for nothing', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
  });
});

describe('RelativeTimePipe', () => {
  const pipe = new RelativeTimePipe();
  const now = new Date('2024-11-15T14:30:00.000Z');

  it('describes past and future instants', () => {
    expect(pipe.transform('2024-11-15T14:30:20.000Z', now)).toBe('now');
    expect(pipe.transform('2024-11-15T15:12:00.000Z', now)).toBe('in 42 min');
    expect(pipe.transform('2024-11-15T11:30:00.000Z', now)).toBe('3 h ago');
    expect(pipe.transform(new Date('2024-11-10T14:30:00.000Z'), now.getTime())).toBe('5 d ago');
    expect(pipe.transform(null)).toBe('');
  });
});

describe('TitleCaseTokenPipe', () => {
  const pipe = new TitleCaseTokenPipe();

  it('turns enum tokens into labels', () => {
    expect(pipe.transform('cutoff-at-risk')).toBe('Cutoff at risk');
    expect(pipe.transform('book_transfer')).toBe('Book transfer');
    expect(pipe.transform('positive-pay.decide')).toBe('Positive pay decide');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
