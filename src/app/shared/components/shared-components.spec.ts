import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideFixtureBackend } from '../../testing/fixture-backend-testing';

import { ApiError } from '../../core/http/api-error';
import { CutoffCountdownComponent } from './cutoff-countdown.component';
import { EmptyStateComponent } from './empty-state.component';
import { ErrorStateComponent } from './error-state.component';
import { KpiTileComponent } from './kpi-tile.component';
import { LoadingStateComponent } from './loading-state.component';
import { StatusBadgeComponent } from './status-badge.component';

describe('shared state components', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideFixtureBackend() }));

  it('ErrorStateComponent derives a message from the ApiError', () => {
    const fixture = TestBed.createComponent(ErrorStateComponent);
    const component = fixture.componentInstance;
    expect(component.message).toContain('did not respond');

    const offline: ApiError = { status: 0, code: 'NETWORK', message: '', correlationId: null };
    component.error = offline;
    expect(component.message).toContain('offline');

    component.error = { status: 403, code: 'FORBIDDEN', message: 'Not allowed', correlationId: 'ldg-1' };
    expect(component.message).toContain('Not allowed');

    component.error = { status: 503, code: 'HTTP_503', message: 'Upstream unavailable', correlationId: 'ldg-1' };
    expect(component.message).toBe('Upstream unavailable');

    component.body = 'Explicit copy wins';
    expect(component.message).toBe('Explicit copy wins');

    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.ldg-error-state__ref')?.textContent).toContain('ldg-1');
    const emitted = jest.fn();
    component.retry.subscribe(emitted);
    root.querySelector<HTMLButtonElement>('button')?.click();
    expect(emitted).toHaveBeenCalled();
  });

  it('EmptyStateComponent renders title, body and projected content', async () => {
    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `<ldg-empty-state title="Nothing here" [body]="body"><button>Reset</button></ldg-empty-state>`
    })
    class HostComponent { body: string | null = 'Body copy'; }
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.ldg-empty-state__title')?.textContent).toBe('Nothing here');
    expect(root.querySelector('.ldg-empty-state__body')?.textContent).toBe('Body copy');
    expect(root.querySelector('button')?.textContent).toBe('Reset');
    fixture.componentInstance.body = null;
    fixture.detectChanges();
    expect(root.querySelector('.ldg-empty-state__body')).toBeNull();
  });

  it('LoadingStateComponent renders the requested skeleton rows', () => {
    const fixture = TestBed.createComponent(LoadingStateComponent);
    fixture.componentRef.setInput('rows', 4);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.ldg-loading-state')?.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelector('.ldg-loading-state')?.getAttribute('aria-label')).toBe('Loading');
    expect(root.querySelectorAll('cn-skeleton').length).toBe(4);
    expect(fixture.componentInstance.rowArray).toEqual([0, 1, 2, 3]);
  });

  it('StatusBadgeComponent maps tokens onto Canopy tones', () => {
    const fixture = TestBed.createComponent(StatusBadgeComponent);
    const component = fixture.componentInstance;
    component.status = 'pending';
    expect(component.tone).toBe('caution');
    component.status = 'rejected';
    expect(component.tone).toBe('warn');
    component.status = 'wire';
    expect(component.tone).toBe('brand');
    fixture.componentRef.setInput('status', 'something-new');
    expect(component.tone).toBe('neutral');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Something new');
    fixture.componentRef.setInput('label', 'Custom');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('Custom');
  });

  it('KpiTileComponent shows trend classes and an optional hint', () => {
    const fixture = TestBed.createComponent(KpiTileComponent);
    fixture.componentRef.setInput('label', 'Pending');
    fixture.componentRef.setInput('value', '11');
    fixture.componentRef.setInput('trend', 'down');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.ldg-kpi__value')?.classList.contains('ldg-negative')).toBe(true);
    expect(root.querySelector('.ldg-kpi__hint')).toBeNull();
    fixture.componentRef.setInput('hint', '3 accounts');
    fixture.componentRef.setInput('trend', 'up');
    fixture.detectChanges();
    expect(root.querySelector('.ldg-kpi__hint')?.textContent).toBe('3 accounts');
    expect(root.querySelector('.ldg-kpi__value')?.classList.contains('ldg-positive')).toBe(true);
  });

  it('CutoffCountdownComponent counts down and flags urgency', () => {
    jest.useFakeTimers({ now: new Date('2024-11-15T14:30:00.000Z') });
    try {
      const fixture = TestBed.createComponent(CutoffCountdownComponent);
      const component = fixture.componentInstance;
      component.cutoffAt = '2024-11-15T16:44:00.000Z';
      expect(component.label()).toBe('2 h 14 min to cutoff');
      expect(component.urgent()).toBe(false);
      component.cutoffAt = '2024-11-15T15:10:00.000Z';
      expect(component.label()).toBe('40 min to cutoff');
      expect(component.urgent()).toBe(true);
      component.cutoffAt = '2024-11-15T14:00:00.000Z';
      expect(component.overdue()).toBe(true);
      expect(component.label()).toBe('cutoff passed 30 min ago');
      expect(component.cutoffAt).toBe('2024-11-15T14:00:00.000Z');
      jest.advanceTimersByTime(60_000);
      expect(component.label()).toBe('cutoff passed 31 min ago');
      fixture.destroy();
    } finally {
      jest.useRealTimers();
    }
  });
});
