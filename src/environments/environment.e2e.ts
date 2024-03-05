import { LdgEnvironment } from './environment.model';

// Cypress. Same fixture backend as local, but the clock is pinned so the axe snapshots and the
// "as of" labels do not drift between runs (LDG-1092: relative dates made the a11y diff noisy).
export const environment: LdgEnvironment = {
  name: 'e2e',
  production: false,
  bffBaseUrl: 'http://localhost:4501/api',
  tickerHausBaseUrl: 'http://localhost:4602',
  fixtureBackend: true,
  fixtureSeed: 'ledgerline-e2e',
  fixtureAsOf: '2024-11-15T14:30:00.000Z',
  sessionIdleMinutes: 15,
  featureFlags: {
    positivePayBulkDecision: true,
    auditExport: true,
    fxStreaming: false
  }
};
