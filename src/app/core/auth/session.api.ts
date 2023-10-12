import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { TreasurySession } from '../models';

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  current(): Observable<TreasurySession> {
    return this.http.get<TreasurySession>(`${this.config.bffBaseUrl}/v1/session`);
  }

  signOut(): Observable<void> {
    return this.http.post<void>(`${this.config.bffBaseUrl}/v1/session/sign-out`, {});
  }
}
