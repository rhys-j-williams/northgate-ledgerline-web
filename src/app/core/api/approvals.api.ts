import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { ApprovalDecision, ApprovalDecisionResult, ApprovalStatus, PaymentApproval } from '../models';

export interface ApprovalsQuery {
  status?: ApprovalStatus[];
  rail?: string[];
}

@Injectable({ providedIn: 'root' })
export class ApprovalsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(APP_CONFIG).bffBaseUrl}/v1/treasury/approvals`;

  list(query: ApprovalsQuery = {}): Observable<PaymentApproval[]> {
    let params = new HttpParams();
    if (query.status?.length) {
      params = params.set('status', query.status.join(','));
    }
    if (query.rail?.length) {
      params = params.set('rail', query.rail.join(','));
    }
    return this.http.get<PaymentApproval[]>(this.base, { params });
  }

  get(approvalId: string): Observable<PaymentApproval> {
    return this.http.get<PaymentApproval>(`${this.base}/${encodeURIComponent(approvalId)}`);
  }

  decide(decision: ApprovalDecision): Observable<ApprovalDecisionResult> {
    return this.http.post<ApprovalDecisionResult>(
      `${this.base}/${encodeURIComponent(decision.approvalId)}/decision`,
      { decision: decision.decision, reason: decision.reason ?? null }
    );
  }
}
