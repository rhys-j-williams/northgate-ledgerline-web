import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuditPage, AuditQuery } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(APP_CONFIG).bffBaseUrl}/v1/treasury/audit/events`;

  search(query: AuditQuery, page = 0, pageSize = 50): Observable<AuditPage> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.actor) params = params.set('actor', query.actor);
    if (query.text) params = params.set('q', query.text);
    if (query.categories?.length) params = params.set('category', query.categories.join(','));
    return this.http.get<AuditPage>(this.base, { params });
  }

  exportCsv(query: AuditQuery): Observable<Blob> {
    let params = new HttpParams();
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
