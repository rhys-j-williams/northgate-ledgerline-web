import { Routes } from '@angular/router';

import { DashboardFiltersStore } from './dashboard-filters.store';

export const LIQUIDITY_ROUTES: Routes = [
  {
    path: '',
    providers: [DashboardFiltersStore],
    loadComponent: () => import('./liquidity-dashboard-page.component').then(m => m.LiquidityDashboardPageComponent)
  }
];
