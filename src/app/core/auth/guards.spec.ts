import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideFixtureBackend, signInFixtureUser } from '../../testing/fixture-backend-testing';
import { authGuard, matchPermission, requirePermission } from './guards';
import { SessionStore } from './session.store';

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

describe('functional guards', () => {
  let store: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    store = TestBed.inject(SessionStore);
  });

  const run = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

  it('authGuard redirects to /forbidden without a session', () => {
    const result = run(() => authGuard(route, state)) as UrlTree;
    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/forbidden?reason=no-session');
  });

  it('authGuard allows a signed in user', () => {
    signInFixtureUser(store);
    expect(run(() => authGuard(route, state))).toBe(true);
  });

  it('requirePermission passes with any one of the listed permissions', () => {
    signInFixtureUser(store);
    expect(run(() => requirePermission('nope', 'accounts:view')(route, state))).toBe(true);
  });

  it('requirePermission redirects with the missing permission in the query', () => {
    signInFixtureUser(store);
    const result = run(() => requirePermission('users:manage')(route, state)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/forbidden?reason=entitlement&need=users:manage');
  });

  it('requirePermission redirects to no-session when signed out', () => {
    const result = run(() => requirePermission('accounts:view')(route, state)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toContain('reason=no-session');
  });

  it('matchPermission hides the route rather than redirecting', () => {
    expect(run(() => matchPermission('audit:read')({}, []))).toBe(false);
    signInFixtureUser(store);
    expect(run(() => matchPermission('audit:read')({}, []))).toBe(true);
  });
});
