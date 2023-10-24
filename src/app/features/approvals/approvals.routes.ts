import { Routes } from '@angular/router';

export const APPROVALS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./approvals-page.component').then(m => m.ApprovalsPageComponent) },
  {
    path: ':approvalId',
    loadComponent: () => import('./approval-detail-page.component').then(m => m.ApprovalDetailPageComponent),
    title: 'Approval'
  }
];
