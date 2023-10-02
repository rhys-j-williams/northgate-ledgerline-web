import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { buildAppConfig } from './app/app.config';
import { applyRuntimeEnv, loadRuntimeEnv } from './app/core/config/runtime-config';
import { environment } from './environments/environment';

// env.json is mounted by the chart; local builds never have one worth reading (see runtime-config.ts).
const runtimeEnv = environment.production ? loadRuntimeEnv() : Promise.resolve(null);

runtimeEnv
  .then(file => bootstrapApplication(AppComponent, buildAppConfig(applyRuntimeEnv(environment, file))))
  .catch(err => console.error(err));
