import { computed, Injectable, signal } from '@angular/core';
import { TreasurySession } from '../models';

/**
 * Who is signed in and what they may do. Populated once by SessionApi at bootstrap (see
 * APP_INITIALIZER in app.config.ts) and read through signals everywhere else.
 *
 * Permissions are strings from entitlements-service ("payments:approve" and friends). The guard
 * and the templates only ever ask `can(permission)`; nobody compares roles by name, because the
 * role catalogue moved under us once already (LDG-905).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessionSignal = signal<TreasurySession | null>(null);
  private readonly loadFailedSignal = signal(false);

  readonly session = this.sessionSignal.asReadonly();
  readonly loadFailed = this.loadFailedSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly displayName = computed(() => this.sessionSignal()?.displayName ?? null);
  readonly organisationName = computed(() => this.sessionSignal()?.organisationName ?? '');
  readonly role = computed(() => this.sessionSignal()?.role ?? null);
  readonly permissions = computed(() => new Set(this.sessionSignal()?.permissions ?? []));
  readonly expiresAt = computed(() => {
    const raw = this.sessionSignal()?.expiresAt;
    return raw ? new Date(raw) : null;
  });

  set(session: TreasurySession): void {
    this.sessionSignal.set(session);
    this.loadFailedSignal.set(false);
  }

  clear(): void {
    this.sessionSignal.set(null);
  }

  markLoadFailed(): void {
    this.loadFailedSignal.set(true);
  }

  can(permission: string): boolean {
    return this.permissions().has(permission);
  }

  canAny(...permissions: string[]): boolean {
    return permissions.some(p => this.can(p));
  }
}
