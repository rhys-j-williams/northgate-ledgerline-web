import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { LiquiditySnapshot } from '../models';

@Injectable({ providedIn: 'root' })
export class LiquidityApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(APP_CONFIG).bffBaseUrl}/v1/treasury/liquidity`;

  snapshot(): Observable<LiquiditySnapshot> {
    return this.http.get<LiquiditySnapshot>(`${this.base}/snapshot`);
  }
}
