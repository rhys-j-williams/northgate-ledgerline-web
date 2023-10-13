import { inject } from '@angular/core';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { SessionApi } from './session.api';
import { SessionStore } from './session.store';

/**
 * Resolve the session before the first route renders. A failure is recorded, not thrown: the
 * shell shows the signed-out state and the guards send the user to /forbidden. Throwing here
 * left users on a white page during the 2024-03 Keystone outage (INC0448121).
 */
export function initialiseSession(): () => Promise<unknown> {
  const api = inject(SessionApi);
  const store = inject(SessionStore);
  return () => firstValueFrom(api.current().pipe(
    tap(session => store.set(session)),
    catchError((err: unknown) => {
      console.warn('[ledgerline] session bootstrap failed', err);
      store.markLoadFailed();
      return of(null);
    })
  ));
}
