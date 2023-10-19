import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CnButtonModule } from '@meridian/canopy-ui/actions';

import { SessionStore } from '../../core/auth/session.store';

type Reason = 'no-session' | 'entitlement' | 'signed-out' | string;

@Component({
  selector: 'ldg-forbidden-page',
  standalone: true,
  imports: [NgIf, RouterLink, CnButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ldg-state-page" aria-labelledby="ldg-forbidden-title">
      <h1 id="ldg-forbidden-title">{{ title() }}</h1>
      <p>{{ body() }}</p>
      <p class="ldg-muted" *ngIf="need">Needs one of: <code>{{ need }}</code></p>
      <cn-button *ngIf="session.isAuthenticated()" variant="primary" routerLink="/dashboard">Back to liquidity</cn-button>
      <p class="ldg-muted" *ngIf="!session.isAuthenticated()">Sign in again from the Keystone portal. If this keeps happening, the entitlements team is on #treasury-entitlements.</p>
    </section>
  `
})
export class ForbiddenPageComponent {
  protected readonly session = inject(SessionStore);
  private readonly reasonSignal = signal<Reason>('entitlement');

  @Input() set reason(value: Reason | undefined) {
    this.reasonSignal.set(value ?? 'entitlement');
  }
  @Input() need: string | undefined;

  readonly title = computed(() => {
    switch (this.reasonSignal()) {
      case 'no-session': return 'Your session is not available';
      case 'signed-out': return 'You have signed out';
      default: return 'You are not entitled to that page';
    }
  });
  readonly body = computed(() => {
    switch (this.reasonSignal()) {
      case 'no-session': return this.session.loadFailed()
        ? 'The session service did not answer. Nothing you were doing has been lost; try again in a minute.'
        : 'No treasury session was found for this browser.';
      case 'signed-out': return 'Close the tab, or sign in again from the portal.';
      default: return 'Your entitlements do not include this area. Your administrator can grant it from Entitlements.';
    }
  });
}
