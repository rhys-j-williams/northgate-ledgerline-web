import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { CN_CONFIG, CN_DEFAULT_CONFIG, CnCoreModule } from '@meridian/canopy-ui/core';
import { CnIconModule } from '@meridian/canopy-ui/icons';

import { routes } from './app.routes';
import { initialiseSession } from './core/auth/session.initializer';
import { APP_CONFIG } from './core/config/app-config';
import { fixtureBackendInterceptor } from './core/fixture-backend/fixture-backend.interceptor';
import { correlationIdInterceptor } from './core/http/correlation-id.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { environment } from '../environments/environment';
import { LdgEnvironment } from '../environments/environment.model';

/**
 * Interceptor order matters: correlation id goes on first so the fixture backend (and the real
 * BFF) both see it; the error interceptor wraps everything below it; the fixture backend is last
 * because it short-circuits the request when APP_CONFIG.fixtureBackend is on.
 */
const interceptorsFor = (config: LdgEnvironment) => [
  correlationIdInterceptor,
  errorInterceptor,
  ...(config.fixtureBackend ? [fixtureBackendInterceptor] : [])
];

export function buildAppConfig(config: LdgEnvironment = environment): ApplicationConfig {
  const interceptors = interceptorsFor(config);
  return {
    providers: [
      { provide: APP_CONFIG, useValue: config },
      provideRouter(
        routes,
        withComponentInputBinding(),
        withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
        withRouterConfig({ paramsInheritanceStrategy: 'always' })
      ),
      provideHttpClient(withInterceptors(interceptors)),
      provideAnimations(),
      // Canopy still ships NgModules; importProvidersFrom is the bridge until 4.x exposes provideCanopy().
      importProvidersFrom(CnCoreModule, CnIconModule, MatSnackBarModule),
      { provide: CN_CONFIG, useValue: { ...CN_DEFAULT_CONFIG, currency: 'USD', locale: 'en-US', themeStorageKey: 'ldg.theme' } },
      { provide: APP_INITIALIZER, useFactory: initialiseSession, multi: true }
    ]
  };
}

export const appConfig: ApplicationConfig = buildAppConfig();
