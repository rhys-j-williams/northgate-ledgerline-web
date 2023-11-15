import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../notification.service';
import { ApiError } from './api-error';
import { correlationIdInterceptor, newCorrelationId } from './correlation-id.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('http interceptors', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let notifications: { error: jest.Mock; info: jest.Mock; success: jest.Mock };

  beforeEach(() => {
    notifications = { error: jest.fn(), info: jest.fn(), success: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationIdInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications }
      ]
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('generates ldg- prefixed correlation ids', () => {
    expect(newCorrelationId()).toMatch(/^ldg-[0-9a-f]{24}$/);
    expect(newCorrelationId()).not.toBe(newCorrelationId());
  });

  it('adds X-Correlation-Id when absent and keeps a caller supplied one', () => {
    http.get('/a').subscribe();
    http.get('/b', { headers: { 'X-Correlation-Id': 'ldg-fixed' } }).subscribe();
    const a = ctrl.expectOne('/a');
    const b = ctrl.expectOne('/b');
    expect(a.request.headers.get('X-Correlation-Id')).toMatch(/^ldg-/);
    expect(b.request.headers.get('X-Correlation-Id')).toBe('ldg-fixed');
    a.flush({});
    b.flush({});
  });

  it('normalises a BFF error body into ApiError and stays quiet for 4xx', () => {
    let caught: ApiError | undefined;
    http.get('/c').subscribe({ error: (e: ApiError) => (caught = e) });
    ctrl.expectOne('/c').flush({ code: 'APPROVAL_NOT_PENDING', message: 'Approval is approved' }, { status: 409, statusText: 'Conflict' });
    expect(caught).toMatchObject({ status: 409, code: 'APPROVAL_NOT_PENDING', message: 'Approval is approved' });
    expect(caught?.correlationId).toMatch(/^ldg-/);
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it('toasts on 5xx and network failures with a synthetic code', () => {
    let caught: ApiError | undefined;
    http.get('/d').subscribe({ error: (e: ApiError) => (caught = e) });
    ctrl.expectOne('/d').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(caught?.code).toBe('HTTP_503');
    expect(notifications.error).toHaveBeenCalledTimes(1);

    http.get('/e').subscribe({ error: (e: ApiError) => (caught = e) });
    ctrl.expectOne('/e').error(new ProgressEvent('error'));
    expect(caught?.code).toBe('NETWORK');
    expect(caught?.status).toBe(0);
    expect(notifications.error).toHaveBeenCalledTimes(2);
  });

  it('passes through things that are not HttpErrorResponse', () => {
    let caught: unknown;
    http.get('/f').subscribe({ error: e => (caught = e) });
    ctrl.expectOne('/f').flush(null, { status: 500, statusText: 'x' });
    expect(caught instanceof HttpErrorResponse).toBe(false);
  });
});

describe('NotificationService', () => {
  it('maps severities onto snack bar options', () => {
    const open = jest.fn();
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open } }] });
    const service = TestBed.inject(NotificationService);
    service.info('i');
    service.success('s');
    service.error('e');
    expect(open).toHaveBeenNthCalledWith(1, 'i', undefined, expect.objectContaining({ politeness: 'polite' }));
    expect(open).toHaveBeenNthCalledWith(2, 's', undefined, expect.objectContaining({ panelClass: 'ldg-snack--success' }));
    expect(open).toHaveBeenNthCalledWith(3, 'e', 'Dismiss', expect.objectContaining({ politeness: 'assertive' }));
  });
});
