import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { APP_CONFIG } from '../config/app-config';
import { ExceptionDecisionRequest, FxQuote, PositivePayException } from '../models';
import { FixtureBackendState } from './fixture-backend.state';

/**
 * Answers the BFF and TickerHaus routes from the in-memory TreasuryDataset when
 * `environment.fixtureBackend` is on. Registered last in the interceptor chain so the
 * correlation id and error handling still run over it exactly as they would over the wire.
 *
 * Cypress runs against this. It is also what most of treasury-digital runs on a laptop, which is
 * why it is kept honest: same shapes, same status codes, a little latency.
 *
 * Not a mock server and not to be extended into one; anything beyond the routes the UI needs
 * goes to mock-external (LDG-733).
 */
export const fixtureBackendInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(APP_CONFIG);
  if (!config.fixtureBackend) {
    return next(req);
  }
  const state = inject(FixtureBackendState);
  const handled = handle(req, state, config.bffBaseUrl, config.tickerHausBaseUrl);
  return handled ? handled.pipe(delay(state.latencyMs)) : next(req);
};

function handle(req: HttpRequest<unknown>, state: FixtureBackendState, bff: string, tickerHaus: string):
  Observable<HttpResponse<unknown>> | null {
  const url = req.urlWithParams;
  const path = url.startsWith(bff) ? url.slice(bff.length) : url.startsWith(tickerHaus) ? url.slice(tickerHaus.length) : null;
  if (path === null) {
    return null;
  }
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  const segments = pathname.split('/').filter(Boolean);
  const data = state.dataset;

  if (req.method === 'GET' && pathname === '/v1/session') {
    return state.signedOut ? fail(401, 'NO_SESSION', 'No treasury session') : ok(data.session);
  }
  if (req.method === 'POST' && pathname === '/v1/session/sign-out') {
    state.signedOut = true;
    return ok(null, 204);
  }

  if (state.outage && segments[1] === 'treasury') {
    return fail(503, 'UPSTREAM_UNAVAILABLE', 'Treasury services are temporarily unavailable');
  }

  if (pathname === '/v1/treasury/approvals' && req.method === 'GET') {
    const statuses = params.get('status')?.split(',');
    const rails = params.get('rail')?.split(',');
    return ok(data.approvals.filter(a => (!statuses || statuses.includes(a.status)) && (!rails || rails.includes(a.rail))));
  }
  if (segments[0] === 'v1' && segments[1] === 'treasury' && segments[2] === 'approvals' && segments[3]) {
    const approval = data.approvals.find(a => a.approvalId === decodeURIComponent(segments[3]));
    if (!approval) {
      return fail(404, 'APPROVAL_NOT_FOUND', `No approval ${segments[3]}`);
    }
    if (req.method === 'GET') {
      return ok(approval);
    }
    if (req.method === 'POST' && segments[4] === 'decision') {
      const body = req.body as { decision: 'approve' | 'reject'; reason: string | null };
      if (approval.status !== 'pending') {
        return fail(409, 'APPROVAL_NOT_PENDING', `Approval is ${approval.status}`);
      }
      if (approval.initiatedBy === data.session.userHandle) {
        return fail(422, 'SELF_APPROVAL', 'Initiator cannot approve their own payment');
      }
      approval.approvalsGiven = [...approval.approvalsGiven, data.session.userHandle];
      approval.status = body.decision === 'reject' ? 'rejected'
        : approval.approvalsGiven.length >= approval.approvalsRequired ? 'approved' : 'pending';
      return ok({
        approvalId: approval.approvalId, status: approval.status, approvalsGiven: approval.approvalsGiven,
        decidedAt: new Date().toISOString()
      });
    }
  }

  if (pathname === '/v1/treasury/liquidity/snapshot') {
    return ok({ organisationId: data.session.organisationId, asOf: data.asOf.toISOString(),
      positions: data.positions, forecast: data.forecast });
  }

  if (pathname === '/v1/treasury/entitlements' && req.method === 'GET') {
    return ok(data.entitlements);
  }
  if (segments[0] === 'v1' && segments[2] === 'entitlements' && segments[3]) {
    const entitlement = data.entitlements.find(e => e.entitlementId === decodeURIComponent(segments[3]));
    if (!entitlement) {
      return fail(404, 'ENTITLEMENT_NOT_FOUND', `No entitlement ${segments[3]}`);
    }
    if (req.method === 'PUT' && segments[4] === 'limits') {
      const body = req.body as { limitPerTransactionMinor: number | null; limitPerDayMinor: number | null; dualApprovalRequired: boolean };
      entitlement.limitPerTransactionMinor = body.limitPerTransactionMinor ?? undefined;
      entitlement.limitPerDayMinor = body.limitPerDayMinor ?? undefined;
      entitlement.dualApprovalRequired = body.dualApprovalRequired;
    }
    return ok(entitlement);
  }

  if (pathname === '/v1/treasury/positive-pay/exceptions' && req.method === 'GET') {
    return ok(data.exceptions);
  }
  if (pathname === '/v1/treasury/positive-pay/exceptions/decisions' && req.method === 'POST') {
    const body = req.body as ExceptionDecisionRequest;
    const updated: PositivePayException[] = [];
    for (const exception of data.exceptions) {
      if (body.exceptionIds.includes(exception.exceptionId)) {
        exception.decision = body.decision;
        exception.decidedBy = data.session.userHandle;
        exception.decidedAt = new Date().toISOString();
        updated.push(exception);
      }
    }
    return ok(updated);
  }

  if (pathname === '/v1/treasury/audit/events' && req.method === 'GET') {
    const categories = params.get('category')?.split(',');
    const actor = params.get('actor')?.toLowerCase();
    const text = params.get('q')?.toLowerCase();
    const from = params.get('from');
    const to = params.get('to');
    const page = Number(params.get('page') ?? 0);
    const pageSize = Number(params.get('pageSize') ?? 50);
    const filtered = data.audit.filter(event =>
      (!categories || categories.includes(event.category))
      && (!actor || event.actor.includes(actor))
      && (!from || event.occurredAt >= from)
      && (!to || event.occurredAt <= to)
      && (!text || `${event.action} ${event.subjectId} ${event.correlationId} ${event.detail ?? ''}`.toLowerCase().includes(text)));
    return ok({ events: filtered.slice(page * pageSize, (page + 1) * pageSize), total: filtered.length });
  }
  if (pathname === '/v1/treasury/audit/events/export') {
    const header = 'eventId,occurredAt,category,action,actor,outcome,subjectId,correlationId';
    const rows = data.audit.map(e => [e.eventId, e.occurredAt, e.category, e.action, e.actor, e.outcome, e.subjectId, e.correlationId].join(','));
    return ok(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }));
  }

  if (pathname === '/v1/fx/pairs') {
    return ok({ pairs: Object.keys(FX_BASE) });
  }
  if (pathname === '/v1/fx/rates') {
    const wanted = params.get('pairs')?.split(',') ?? Object.keys(FX_BASE);
    const unknown = wanted.filter(p => !(p in FX_BASE));
    if (unknown.length) {
      return fail(400, 'UNKNOWN_PAIR', `unsupported pair(s): ${unknown.join(',')}`);
    }
    return ok({ rates: wanted.map(pair => fxQuote(pair, state.tick())), asOf: new Date().toISOString() });
  }

  return fail(404, 'NOT_FOUND', `fixture backend has no route for ${req.method} ${pathname}`);
}

// Same base rates as mock-external/tickerhaus-mock so numbers look familiar between the two.
const FX_BASE: Record<string, number> = {
  EURUSD: 1.0842, GBPUSD: 1.2710, USDJPY: 149.32, USDCAD: 1.3565, USDMXN: 17.08, AUDUSD: 0.6551, USDCHF: 0.8812, USDCNH: 7.2140
};

function fxQuote(pair: string, tick: number): FxQuote {
  const base = FX_BASE[pair];
  const seed = pair.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const mid = base * (1 + Math.sin(tick / 7 + seed) * 0.0018);
  const decimals = pair.endsWith('JPY') ? 3 : 5;
  const spread = mid * 0.0002;
  return {
    pair, base: pair.slice(0, 3), quote: pair.slice(3),
    bid: Number((mid - spread / 2).toFixed(decimals)),
    ask: Number((mid + spread / 2).toFixed(decimals)),
    mid: Number(mid.toFixed(decimals)),
    timestamp: new Date().toISOString(),
    source: 'FIXTURE'
  };
}

function ok<T>(body: T, status = 200): Observable<HttpResponse<T>> {
  return of(new HttpResponse({ status, body }));
}

function fail(status: number, code: string, message: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: { code, message } }));
}
