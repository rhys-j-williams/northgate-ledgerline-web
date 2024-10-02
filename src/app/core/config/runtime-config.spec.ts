import { LdgEnvironment } from '@env/environment.model';

import { applyRuntimeEnv, loadRuntimeEnv } from './runtime-config';

const base: LdgEnvironment = {
  name: 'production',
  production: true,
  bffBaseUrl: '/api/business',
  tickerHausBaseUrl: '/api/markets',
  fixtureBackend: false,
  fixtureSeed: 'ledgerline',
  sessionIdleMinutes: 10,
  featureFlags: { positivePayBulkDecision: false, auditExport: true, fxStreaming: false }
};

describe('applyRuntimeEnv', () => {
  it('overlays the chart keys onto the compiled environment', () => {
    const merged = applyRuntimeEnv(base, {
      apiBaseUrl: 'https://ledgerline-uat.example.com/api',
      sessionTimeoutMinutes: 12,
      featureFlags: { positivePayBulkDecision: true }
    });
    expect(merged.bffBaseUrl).toBe('https://ledgerline-uat.example.com/api');
    expect(merged.tickerHausBaseUrl).toBe('/api/markets');
    expect(merged.sessionIdleMinutes).toBe(12);
    expect(merged.featureFlags).toEqual({ positivePayBulkDecision: true, auditExport: true, fxStreaming: false });
  });

  it('ignores the file outside production so fixtures cannot be redirected', () => {
    const local = { ...base, name: 'local' as const, production: false };
    expect(applyRuntimeEnv(local, { apiBaseUrl: 'https://elsewhere.example.com' })).toBe(local);
    expect(applyRuntimeEnv(base, null)).toBe(base);
  });
});

describe('loadRuntimeEnv', () => {
  it('parses env.json when present', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ apiBaseUrl: '/x' }) });
    await expect(loadRuntimeEnv(fetchImpl as unknown as typeof fetch)).resolves.toEqual({ apiBaseUrl: '/x' });
    expect(fetchImpl).toHaveBeenCalledWith('env.json', { cache: 'no-store' });
  });

  it('returns null on 404 or network failure', async () => {
    await expect(loadRuntimeEnv(jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch)).resolves.toBeNull();
    await expect(loadRuntimeEnv(jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)).resolves.toBeNull();
  });
});
