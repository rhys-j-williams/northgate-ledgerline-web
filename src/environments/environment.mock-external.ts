import { LdgEnvironment } from './environment.model';

// Against mock-external/estate-up.sh: bff-business on 4501 (global prefix /api/v1), TickerHaus mock on 4602.
// Contract drift, tracked in LDG-1211: bff-business today serves /approvals, /treasury/positions and
// /entitlements/me; the /treasury/liquidity, /positive-pay and /audit routes this app calls are in
// business-digital's Q4 backlog (PLAT-1402). Until they land, only the approvals queue works on the wire.
export const environment: LdgEnvironment = {
  name: 'mock-external',
  production: false,
  bffBaseUrl: 'http://localhost:4501/api',
  tickerHausBaseUrl: 'http://localhost:4602',
  fixtureBackend: false,
  fixtureSeed: 'ledgerline',
  sessionIdleMinutes: 15,
  featureFlags: {
    positivePayBulkDecision: true,
    auditExport: true,
    fxStreaming: false
  }
};
