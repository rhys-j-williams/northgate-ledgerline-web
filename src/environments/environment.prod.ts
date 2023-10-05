import { LdgEnvironment } from './environment.model';

// Production values are injected at deploy time by the Helm chart (see helm/ledgerline-web),
// which mounts /env.json (see core/config/runtime-config.ts). These are the fallbacks if that file is missing,
// and they are wrong on purpose so the failure is visible (LDG-1421).
export const environment: LdgEnvironment = {
  name: 'production',
  production: true,
  bffBaseUrl: '/api/business',
  tickerHausBaseUrl: '/api/markets',
  fixtureBackend: false,
  fixtureSeed: 'ledgerline',
  sessionIdleMinutes: 10,
  featureFlags: {
    positivePayBulkDecision: false,
    auditExport: true,
    fxStreaming: false
  }
};
