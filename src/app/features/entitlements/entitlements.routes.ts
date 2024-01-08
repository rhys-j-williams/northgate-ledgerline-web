import { Routes } from '@angular/router';

import { requirePermission } from '../../core/auth/guards';

export const ENTITLEMENTS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./entitlements-page.component').then(m => m.EntitlementsPageComponent) },
  {
    path: ':entitlementId',
    loadComponent: () => import('./entitlement-detail-page.component').then(m => m.EntitlementDetailPageComponent),
    canActivate: [requirePermission('entitlements:manage', 'users:manage', 'entitlements:view')],
    title: 'Entitlement'
  }
];
