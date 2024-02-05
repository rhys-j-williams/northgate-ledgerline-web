import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { ExceptionDecisionRequest, PositivePayException } from '../models';

@Injectable({ providedIn: 'root' })
export class PositivePayApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(APP_CONFIG).bffBaseUrl}/v1/treasury/positive-pay/exceptions`;

  list(): Observable<PositivePayException[]> {
    return this.http.get<PositivePayException[]>(this.base);
  }

  decide(request: ExceptionDecisionRequest): Observable<PositivePayException[]> {
    return this.http.post<PositivePayException[]>(`${this.base}/decisions`, request);
  }
}
