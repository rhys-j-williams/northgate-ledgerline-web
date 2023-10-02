import { Routes } from '@angular/router';

import { authGuard, matchPermission, requirePermission } from './core/auth/guards';

/**
 * Feature areas are lazy per directory. Guards are functional; permissions are the strings
 * entitlements-service hands back in the session, see core/auth/guards.ts.
 *
 * `audit` uses canMatch rather than canActivate so auditors see it in the nav and nobody else
 * sees a 403 page for it (LDG-1320).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/shell/treasury-shell.component').then(m => m.TreasuryShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/liquidity/liquidity.routes').then(m => m.LIQUIDITY_ROUTES),
        canActivate: [requirePermission('accounts:view')],
        title: 'Liquidity'
      },
      {
        path: 'approvals',
        loadChildren: () => import('./features/approvals/approvals.routes').then(m => m.APPROVALS_ROUTES),
        canActivate: [requirePermission('payments:approve', 'payments:initiate')],
        title: 'Payment approvals'
      },
      {
        path: 'entitlements',
        loadChildren: () => import('./features/entitlements/entitlements.routes').then(m => m.ENTITLEMENTS_ROUTES),
        canActivate: [requirePermission('entitlements:view', 'entitlements:manage', 'users:manage')],
        title: 'Entitlements'
      },
      {
        path: 'positive-pay',
        loadChildren: () => import('./features/positive-pay/positive-pay.routes').then(m => m.POSITIVE_PAY_ROUTES),
        canActivate: [requirePermission('positive-pay:decide', 'accounts:view')],
        title: 'Positive pay'
      },
      {
        path: 'audit',
        loadChildren: () => import('./features/audit/audit.routes').then(m => m.AUDIT_ROUTES),
        canMatch: [matchPermission('audit:read')],
        title: 'Audit'
      }
    ]
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./features/shell/forbidden-page.component').then(m => m.ForbiddenPageComponent),
    title: 'Not permitted'
  },
  {
    path: '**',
    loadComponent: () => import('./features/shell/not-found-page.component').then(m => m.NotFoundPageComponent),
    title: 'Not found'
  }
];
