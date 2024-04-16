import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SessionStore } from '../../core/auth/session.store';
import { FixtureBackendState } from '../../core/fixture-backend/fixture-backend.state';
import { provideFixtureBackend, signInFixtureUser } from '../../testing/fixture-backend-testing';
import { renderPage, settle } from '../../testing/page-testing';
import { ForbiddenPageComponent } from './forbidden-page.component';
import { NotFoundPageComponent } from './not-found-page.component';
import { SessionExpiryComponent } from './session-expiry.component';
import { TreasuryShellComponent } from './treasury-shell.component';

describe('TreasuryShellComponent', () => {
  it('builds the nav from entitlements with a live approvals badge', async () => {
    const fixture = await renderPage(TreasuryShellComponent);
    const state = TestBed.inject(FixtureBackendState);
    const pending = state.dataset.approvals.filter(a => a.status === 'pending').length;
    const nav = (fixture.componentInstance as unknown as { nav(): { id: string; badge?: number | null }[] }).nav();
    expect(nav.map(n => n.id)).toEqual(['dashboard', 'approvals', 'positive-pay', 'entitlements', 'audit']);
    expect(nav[1].badge).toBe(pending);
    expect(fixture.nativeElement.textContent).toContain(state.dataset.session.displayName);
    expect(fixture.nativeElement.textContent).toContain('test');

    const store = TestBed.inject(SessionStore);
    store.set({ ...store.session()!, permissions: ['accounts:view'] });
    fixture.detectChanges();
    expect((fixture.componentInstance as unknown as { nav(): { id: string }[] }).nav().map(n => n.id)).not.toContain('audit');
  });

  it('signs out through the BFF and lands on the forbidden page', async () => {
    const fixture = await renderPage(TreasuryShellComponent);
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.signOut();
    await settle(fixture);
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
    expect(TestBed.inject(FixtureBackendState).signedOut).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/forbidden'], { queryParams: { reason: 'signed-out' } });
  });
});

describe('ForbiddenPageComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: provideFixtureBackend() }));

  it('explains each reason', () => {
    const fixture = TestBed.createComponent(ForbiddenPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.title()).toContain('not entitled');
    fixture.componentRef.setInput('reason', 'signed-out');
    expect(component.title()).toBe('You have signed out');
    fixture.componentRef.setInput('reason', 'no-session');
    expect(component.body()).toContain('No treasury session');
    TestBed.inject(SessionStore).markLoadFailed();
    expect(component.body()).toContain('did not answer');
    fixture.componentRef.setInput('need', 'audit:read');
    fixture.componentRef.setInput('reason', undefined);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('audit:read');
  });
});

describe('NotFoundPageComponent', () => {
  it('renders', () => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('nothing at this address');
  });
});

describe('SessionExpiryComponent', () => {
  it('counts the minutes down and turns amber inside ten', () => {
    jest.useFakeTimers({ now: new Date('2024-11-15T14:30:00.000Z') });
    try {
      TestBed.configureTestingModule({ providers: provideFixtureBackend() });
      const store = TestBed.inject(SessionStore);
      const fixture = TestBed.createComponent(SessionExpiryComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.minutesLeft()).toBeNull();
      expect(fixture.nativeElement.querySelector('.ldg-session-expiry')).toBeNull();

      signInFixtureUser(store);
      fixture.detectChanges();
      expect(fixture.componentInstance.minutesLeft()).toBe(45);
      expect(fixture.componentInstance.soon()).toBe(false);
      expect(fixture.componentInstance.tooltip()).toContain('Signed in until');

      jest.advanceTimersByTime(36 * 60_000);
      fixture.detectChanges();
      expect(fixture.componentInstance.minutesLeft()).toBe(9);
      expect(fixture.componentInstance.soon()).toBe(true);
      expect(fixture.nativeElement.querySelector('.ldg-session-expiry--soon')).not.toBeNull();
      fixture.destroy();
    } finally {
      jest.useRealTimers();
    }
  });
});
