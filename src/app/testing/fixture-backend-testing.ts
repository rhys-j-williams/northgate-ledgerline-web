import { HttpInterceptorFn, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, importProvidersFrom, Provider } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Routes } from '@angular/router';
import { readFileSync } from 'fs';
import { join } from 'path';
import { of } from 'rxjs';
import { CN_CONFIG, CN_DEFAULT_CONFIG, CnCoreModule } from '@meridian/canopy-ui/core';
import { CnIconModule } from '@meridian/canopy-ui/icons';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { LdgEnvironment } from '@env/environment.model';

import { SessionStore } from '../core/auth/session.store';
import { APP_CONFIG } from '../core/config/app-config';
import { FixtureBackendState } from '../core/fixture-backend/fixture-backend.state';
import { fixtureBackendInterceptor } from '../core/fixture-backend/fixture-backend.interceptor';
import { buildTreasuryDataset } from '../core/fixture-backend/treasury-dataset';
import { correlationIdInterceptor } from '../core/http/correlation-id.interceptor';
import { errorInterceptor } from '../core/http/error.interceptor';

/** Frozen clock every spec shares. Matches the Cypress fixture clock (cypress/support/e2e.ts). */
export const TEST_AS_OF = '2024-11-15T14:30:00.000Z';

export const TEST_ENVIRONMENT: LdgEnvironment = {
  name: 'test',
  production: false,
  bffBaseUrl: 'http://bff.test',
  tickerHausBaseUrl: 'http://tickerhaus.test',
  fixtureBackend: true,
  fixtureSeed: 'ledgerline-spec',
  fixtureAsOf: TEST_AS_OF,
  sessionIdleMinutes: 15,
  featureFlags: { positivePayBulkDecision: true, auditExport: true, fxStreaming: false }
};

/** jsdom has no dev server to fetch the Canopy sprite from, so serve src/assets straight off disk. */
const staticAssetsInterceptor: HttpInterceptorFn = (req, next) =>
  req.url.startsWith('assets/')
    ? of(new HttpResponse({ status: 200, body: readFileSync(join(__dirname, '../../', req.url), 'utf8') }))
    : next(req);

/**
 * The same wiring app.config.ts uses, minus the router and the session initialiser, on top of the
 * fixture backend with zero latency. Specs that want the wire to fail flip
 * `TestBed.inject(FixtureBackendState)` before they exercise the component.
 */
export function provideFixtureBackend(overrides: Partial<LdgEnvironment> = {}, routes: Routes = []):
  (Provider | EnvironmentProviders)[] {
  return [
    { provide: APP_CONFIG, useValue: { ...TEST_ENVIRONMENT, ...overrides } },
    provideHttpClient(withInterceptors([staticAssetsInterceptor, correlationIdInterceptor, errorInterceptor, fixtureBackendInterceptor])),
    provideRouter(routes),
    importProvidersFrom(NoopAnimationsModule, CnCoreModule, CnIconModule, MatSnackBarModule),
    { provide: CN_CONFIG, useValue: { ...CN_DEFAULT_CONFIG, currency: 'USD', locale: 'en-US' } },
    {
      provide: FixtureBackendState,
      useFactory: () => {
        const state = new FixtureBackendState();
        state.latencyMs = 0;
        return state;
      }
    }
  ];
}

/** Puts the fixture session into the store the way the APP_INITIALIZER would have. */
export function signInFixtureUser(store: SessionStore, seed = TEST_ENVIRONMENT.fixtureSeed): void {
  store.set(buildTreasuryDataset(seed, TEST_AS_OF).session);
}

export function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}
