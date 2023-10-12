import type { Entitlement } from '@meridian/domain-fixtures';

export type EntitlementRole = Entitlement['role'];

export interface TreasurySession {
  userHandle: string;
  displayName: string;
  organisationId: string;
  organisationName: string;
  role: EntitlementRole;
  permissions: string[];
  /** Absolute time the BFF will stop honouring the session cookie. */
  expiresAt: string;
  mfaSatisfied: boolean;
}
