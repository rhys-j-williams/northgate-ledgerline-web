import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Every BFF call carries X-Correlation-Id so the Kibana trail joins the browser to
 * payments-orchestrator. The BFF echoes it back; ErrorInterceptor surfaces it in the toast so
 * a user can read it to service desk. Format is fixed by PLAT-2210, do not change it.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('X-Correlation-Id')) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { 'X-Correlation-Id': newCorrelationId() } }));
};

export function newCorrelationId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `ldg-${hex}`;
}
