import { LdgEnvironment } from '@env/environment.model';

/**
 * Shape of /env.json as rendered by the Helm chart's ConfigMap (platform-tooling/helm/ledgerline-web,
 * `env:` block). The chart is shared with the other Angular front ends, so the key names are theirs,
 * not ours; the mapping below is the only place that knows about both.
 */
export interface RuntimeEnvFile {
  environment?: string;
  apiBaseUrl?: string;
  marketsBaseUrl?: string;
  sessionTimeoutMinutes?: number;
  featureFlags?: Partial<LdgEnvironment['featureFlags']>;
}

export const RUNTIME_ENV_PATH = 'env.json';

/**
 * Overlays the deploy-time file on the compiled environment. Only production reads the file; the
 * local and e2e builds are pinned to fixtures and must not be redirected by a stray env.json
 * (LDG-1421 was exactly that, with a UAT file left in a developer's dist/).
 */
export function applyRuntimeEnv(base: LdgEnvironment, file: RuntimeEnvFile | null): LdgEnvironment {
  if (!base.production || !file) {
    return base;
  }
  return {
    ...base,
    bffBaseUrl: file.apiBaseUrl ?? base.bffBaseUrl,
    tickerHausBaseUrl: file.marketsBaseUrl ?? base.tickerHausBaseUrl,
    sessionIdleMinutes: file.sessionTimeoutMinutes ?? base.sessionIdleMinutes,
    featureFlags: { ...base.featureFlags, ...(file.featureFlags ?? {}) }
  };
}

export async function loadRuntimeEnv(fetchImpl: typeof fetch = fetch): Promise<RuntimeEnvFile | null> {
  try {
    const response = await fetchImpl(RUNTIME_ENV_PATH, { cache: 'no-store' });
    return response.ok ? ((await response.json()) as RuntimeEnvFile) : null;
  } catch {
    // Missing or unparsable file: boot with the compiled fallbacks, which are deliberately wrong
    // so the problem is visible on the first API call rather than silently hitting the wrong host.
    return null;
  }
}
