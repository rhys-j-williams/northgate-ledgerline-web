import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Thin wrapper so features do not import MatSnackBar directly. Canopy has cn-toast in the
 * overlays entry, but it pulls the whole overlays bundle and its Angular 14 tooltip; we keep
 * the snack bar until Canopy 4 (LDG-1187).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  info(message: string): void {
    this.snackBar.open(message, undefined, { duration: 4000, politeness: 'polite' });
  }

  success(message: string): void {
    this.snackBar.open(message, undefined, { duration: 4000, panelClass: 'ldg-snack--success', politeness: 'polite' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 10000, panelClass: 'ldg-snack--error', politeness: 'assertive' });
  }
}
