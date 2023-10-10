import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CnNavItem, CnPageShellModule } from '@meridian/canopy-ui/layout';

import { SessionApi } from '../../core/auth/session.api';
import { SessionStore } from '../../core/auth/session.store';
import { APP_CONFIG } from '../../core/config/app-config';
import { ApprovalsStore } from '../approvals/approvals.store';
import { SessionExpiryComponent } from './session-expiry.component';

@Component({
  selector: 'ldg-treasury-shell',
  standalone: true,
  imports: [RouterOutlet, CnPageShellModule, SessionExpiryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cn-page-shell data-test="shell-nav" appName="Ledgerline" [environmentLabel]="environmentLabel" [nav]="nav()" [userName]="session.displayName()"
                   [showThemeToggle]="true" maxContentWidth="1440px" (signOut)="signOut()">
      <ldg-session-expiry cnShellToolbar></ldg-session-expiry>
      <router-outlet></router-outlet>
    </cn-page-shell>
  `
})
export class TreasuryShellComponent {
  protected readonly session = inject(SessionStore);
  private readonly sessionApi = inject(SessionApi);
  private readonly router = inject(Router);
  private readonly approvals = inject(ApprovalsStore);
  private readonly config = inject(APP_CONFIG);

  protected readonly environmentLabel = this.config.production ? null : this.config.name;

  /** Nav is a computed signal so the approvals badge updates without the shell re-fetching anything. */
  protected readonly nav = computed<CnNavItem[]>(() => {
    const pending = this.approvals.pendingCount();
    const items: CnNavItem[] = [
      { id: 'dashboard', label: 'Liquidity', icon: 'cn:home', link: '/dashboard' },
      { id: 'approvals', label: 'Approvals', icon: 'cn:check', link: '/approvals', badge: pending > 0 ? pending : null },
      { id: 'positive-pay', label: 'Positive pay', icon: 'cn:alert', link: '/positive-pay' },
      { id: 'entitlements', label: 'Entitlements', icon: 'cn:user', link: '/entitlements' }
    ];
    if (this.session.can('audit:read')) {
      items.push({ id: 'audit', label: 'Audit', icon: 'cn:document', link: '/audit' });
    }
    return items;
  });

  constructor() {
    this.approvals.refreshCount();
  }

  signOut(): void {
    this.sessionApi.signOut().subscribe({
      complete: () => {
        this.session.clear();
        void this.router.navigate(['/forbidden'], { queryParams: { reason: 'signed-out' } });
      }
    });
  }
}
