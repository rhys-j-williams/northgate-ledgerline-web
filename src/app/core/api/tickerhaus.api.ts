import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { APP_CONFIG } from '../config/app-config';
import { FxPairsResponse, FxRatesResponse } from '../models';

/**
 * TickerHaus is called directly from the browser, not through the BFF, under the vendor's
 * CORS allow-list (GIS-3312 accepted the risk for read-only rate data). The production URL is a
 * reverse proxy path so the vendor key never reaches the client.
 *
 * Polling interval is 15s. The vendor charges per request above a tier; do not go below 10s
 * without telling treasury-ops (LDG-1544).
 */
@Injectable({ providedIn: 'root' })
export class TickerHausApi {
  static readonly POLL_MS = 15_000;

  private readonly http = inject(HttpClient);
  private readonly base = `${inject(APP_CONFIG).tickerHausBaseUrl}/v1`;

  pairs(): Observable<FxPairsResponse> {
    return this.http.get<FxPairsResponse>(`${this.base}/fx/pairs`);
  }

  rates(pairs: string[]): Observable<FxRatesResponse> {
    const params = new HttpParams().set('pairs', pairs.join(','));
    return this.http.get<FxRatesResponse>(`${this.base}/fx/rates`, { params });
  }

  pollRates(pairs: string[], intervalMs = TickerHausApi.POLL_MS): Observable<FxRatesResponse> {
    return timer(0, intervalMs).pipe(switchMap(() => this.rates(pairs)));
  }
}
