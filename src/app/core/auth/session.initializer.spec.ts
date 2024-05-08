import { TestBed } from '@angular/core/testing';
import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { FixtureBackendState } from '../fixture-backend/fixture-backend.state';
import { initialiseSession } from './session.initializer';
import { SessionStore } from './session.store';

describe('initialiseSession', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('loads the session into the store', async () => {
    const init = TestBed.runInInjectionContext(initialiseSession);
    await init();
    const store = TestBed.inject(SessionStore);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.session()?.permissions.length).toBeGreaterThan(0);
  });

  it('records a failure instead of throwing', async () => {
    TestBed.inject(FixtureBackendState).signedOut = true;
    const init = TestBed.runInInjectionContext(initialiseSession);
    await expect(init()).resolves.toBeNull();
    expect(TestBed.inject(SessionStore).loadFailed()).toBe(true);
    expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(false);
  });
});
