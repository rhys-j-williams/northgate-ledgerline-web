import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SessionStore } from '../../core/auth/session.store';

/** Top bar pill: "Session 41 min". Turns amber inside ten minutes. Idle logout itself is the BFF's job. */
@Component({
  selector: 'ldg-session-expiry',
  standalone: true,
  imports: [NgIf, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span *ngIf="minutesLeft() !== null" class="ldg-session-expiry" [class.ldg-session-expiry--soon]="soon()"
          role="status" [matTooltip]="tooltip()">Session {{ minutesLeft() }} min</span>
  `,
  styles: [`
    /* Sits on the shell toolbar (brand green), so it carries its own surface; muted-on-green failed contrast (LDG-1092). */
    .ldg-session-expiry { font-size: 12px; padding: 2px 10px; border-radius: 12px; border: 1px solid var(--cn-color-border); background: var(--cn-color-surface); color: var(--cn-color-text); }
    .ldg-session-expiry--soon { border-color: var(--ldg-color-cutoff); color: var(--ldg-color-cutoff); font-weight: 600; }
  `]
})
export class SessionExpiryComponent {
  private readonly store = inject(SessionStore);
  private readonly now = signal(Date.now());

  readonly minutesLeft = computed(() => {
    const expires = this.store.expiresAt();
    return expires ? Math.max(0, Math.round((expires.getTime() - this.now()) / 60_000)) : null;
  });
  readonly soon = computed(() => (this.minutesLeft() ?? Infinity) <= 10);
  readonly tooltip = computed(() => {
    const expires = this.store.expiresAt();
    return expires ? `Signed in until ${expires.toLocaleTimeString()}` : '';
  });

  constructor() {
    const handle = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(handle));
  }
}
