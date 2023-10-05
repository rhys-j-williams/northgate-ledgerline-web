export interface LdgFeatureFlags {
  /** LDG-1633: approve or return several positive pay exceptions in one decision. */
  positivePayBulkDecision: boolean;
  /** LDG-1702: CSV export from the audit view. Gated per organisation in production. */
  auditExport: boolean;
  /** LDG-1811: TickerHaus SSE stream instead of polling. Off until the vendor fixes reconnects. */
  fxStreaming: boolean;
}

export interface LdgEnvironment {
  name: 'local' | 'mock-external' | 'e2e' | 'production' | 'test';
  production: boolean;
  bffBaseUrl: string;
  tickerHausBaseUrl: string;
  /** Serve the application from @meridian/domain-fixtures instead of the BFF. Never true in prod. */
  fixtureBackend: boolean;
  fixtureSeed: string;
  /** Freeze the fixture clock (ISO instant). Cypress and Jest set it; leave undefined for a live day. */
  fixtureAsOf?: string;
  sessionIdleMinutes: number;
  featureFlags: LdgFeatureFlags;
}
