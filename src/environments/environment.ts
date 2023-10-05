import { LdgEnvironment } from './environment.model';

// Laptop default. bff-business is rarely up locally (it is owned by platform-services and needs
// the Bedrock stubs), so the fixture backend answers in its place. Flip fixtureBackend to false and
// run `npm run start:mock-external` when you actually need the wire.
export const environment: LdgEnvironment = {
  name: 'local',
  production: false,
  bffBaseUrl: 'http://localhost:4501/api',
  tickerHausBaseUrl: 'http://localhost:4602',
  fixtureBackend: true,
  fixtureSeed: 'ledgerline',
  sessionIdleMinutes: 15,
  featureFlags: {
    positivePayBulkDecision: true,
    auditExport: true,
    fxStreaming: false
  }
};
