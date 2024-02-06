import { Routes } from '@angular/router';

export const POSITIVE_PAY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./positive-pay-page.component').then(m => m.PositivePayPageComponent) }
];
