import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notification.service';
import { ApiError } from './api-error';

interface BffErrorBody {
  code?: string;
  message?: string;
}

/**
 * Normalises BFF failures into ApiError and toasts anything that is not a 4xx the caller is
 * expected to handle itself (409 on a stale approval, 422 validation). 401 is left alone: the
 * session initialiser and the idle timer own sign-out.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((response: unknown) => {
      if (!(response instanceof HttpErrorResponse)) {
        return throwError(() => response);
      }
      const body = (response.error ?? {}) as BffErrorBody;
      const error: ApiError = {
        status: response.status,
        code: body.code ?? (response.status === 0 ? 'NETWORK' : 'HTTP_' + response.status),
        message: body.message ?? response.message,
        correlationId: response.headers.get('X-Correlation-Id') ?? req.headers.get('X-Correlation-Id')
      };
      if (error.status === 0 || error.status >= 500) {
        notifications.error(`Something went wrong talking to the bank. Reference ${error.correlationId ?? 'unavailable'}.`);
      }
      return throwError(() => error);
    })
  );
};
