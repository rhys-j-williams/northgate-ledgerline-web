import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, signal } from '@angular/core';

/**
 * "2 h 14 min to cutoff" that re-renders once a minute. Signals rather than an async pipe so the
 * parent can stay OnPush without a subscription; the interval is cleared on destroy.
 */
@Component({
  selector: 'ldg-cutoff-countdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="ldg-num" [class.ldg-negative]="overdue()" [class.ldg-cutoff]="urgent()" [attr.title]="cutoffAt">{{ label() }}</span>`,
  styles: [`.ldg-cutoff { color: var(--ldg-color-cutoff); font-weight: 600; }`]
})
export class CutoffCountdownComponent {
  private readonly cutoff = signal<number>(0);
  private readonly now = signal<number>(Date.now());

  @Input({ required: true }) set cutoffAt(value: string) {
    this.cutoff.set(new Date(value).getTime());
  }
  get cutoffAt(): string {
    return new Date(this.cutoff()).toISOString();
  }

  readonly remainingMs = computed(() => this.cutoff() - this.now());
  readonly overdue = computed(() => this.remainingMs() < 0);
  readonly urgent = computed(() => !this.overdue() && this.remainingMs() < 60 * 60_000);
  readonly label = computed(() => {
    const ms = Math.abs(this.remainingMs());
    const minutes = Math.round(ms / 60_000);
    const text = minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
    return this.overdue() ? `cutoff passed ${text} ago` : `${text} to cutoff`;
  });

  constructor() {
    const handle = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(handle));
  }
}
