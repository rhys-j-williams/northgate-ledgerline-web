import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Entitlement } from '@meridian/domain-fixtures';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

export interface EntitlementLimitUpdate {
  limitPerTransactionMinor: number | null;
  limitPerDayMinor: number | null;
  dualApprovalRequired: boolean;
}

@Injectable({ providedIn: 'root' })
export class EntitlementsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(APP_CONFIG).bffBaseUrl}/v1/treasury/entitlements`;

  list(): Observable<Entitlement[]> {
    return this.http.get<Entitlement[]>(this.base);
  }

  get(entitlementId: string): Observable<Entitlement> {
    return this.http.get<Entitlement>(`${this.base}/${encodeURIComponent(entitlementId)}`);
  }

  updateLimits(entitlementId: string, update: EntitlementLimitUpdate): Observable<Entitlement> {
    return this.http.put<Entitlement>(`${this.base}/${encodeURIComponent(entitlementId)}/limits`, update);
  }
}
