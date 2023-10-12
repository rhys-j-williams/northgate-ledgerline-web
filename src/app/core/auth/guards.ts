import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { SessionStore } from './session.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(SessionStore);
  const router = inject(Router);
  return store.isAuthenticated() ? true : router.createUrlTree(['/forbidden'], {
    queryParams: { reason: 'no-session' }
  });
};

/** Route needs at least one of the given permissions. */
export function requirePermission(...permissions: string[]): CanActivateFn {
  return () => {
    const store = inject(SessionStore);
    const router = inject(Router);
    if (!store.isAuthenticated()) {
      return router.createUrlTree(['/forbidden'], { queryParams: { reason: 'no-session' } });
    }
    return store.canAny(...permissions)
      ? true
      : router.createUrlTree(['/forbidden'], { queryParams: { reason: 'entitlement', need: permissions.join(',') } });
  };
}

/** Hide a route entirely (rather than redirect) unless the permission is held. Used for the audit view. */
export function matchPermission(permission: string): CanMatchFn {
  return () => inject(SessionStore).can(permission);
}
