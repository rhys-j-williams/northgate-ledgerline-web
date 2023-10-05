import { InjectionToken } from '@angular/core';
import { LdgEnvironment } from '@env/environment.model';
import { environment } from '@env/environment';

export const APP_CONFIG = new InjectionToken<LdgEnvironment>('ldg.app-config', {
  providedIn: 'root',
  factory: () => environment
});
