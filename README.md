# ledgerline-web

Treasury workstation for Meridian Business corporate clients: payment approvals (maker/checker),
intraday liquidity with TickerHaus FX, user entitlements, positive pay exceptions, audit history.
Served at `/treasury` behind the business channel gateway. Owner `@meridian/treasury-digital`,
Jersey City, with business-digital in Chennai covering the overnight rota. Ticket key `LDG`. Channel `#treasury-digital`.

Not to be confused with `business-web`, which is the older Meridian Business portal on Angular 14
that this application was split out of in late 2023 (LDG-1001, the "carve-out"). Anything about
ACH origination, wires or statements is still over there.

## Stack

| | Version | Notes |
|---|---|---|
| Node | 18.19.0 | `.nvmrc`. Agents are `nodejs18-rhel9`. |
| Angular | 16.2.12 | CLI 16.2.16. Standalone throughout, no NgModules of our own. |
| TypeScript | 5.1.6 | |
| Angular Material / CDK | 16.2.14 | MDC components. |
| `@meridian/canopy-ui` | 3.7.2 | Angular 14 peers. See "Canopy" below before you touch anything. |
| `@meridian/domain-fixtures` | 1.6.0 | Treasury segment, drives the fixture backend and every test. |
| Jest | 29.7 via `jest-preset-angular` 13.1.4 | Not Karma. `npx jest`. |
| Cypress | 13.6.6 + `cypress-axe` | Two headless axe-core specs, WCAG 2.1 AA tags. |
| ESLint | 8.56 + angular-eslint 16 | `npx eslint .` |

Versions are exact in `package.json` (`save-exact=true` in `.npmrc`), lockfile v3 is committed.
Dependency bumps arrive from the dependency bot on `chore/deps-*` branches and go through the
normal review; do not bump by hand in a feature branch, it makes the train diff unreadable.

## Running it

```
nvm use
npm ci                  # postinstall runs patch-package, see Canopy
npm start               # http://127.0.0.1:4203, fixture backend, live clock
npm test                # jest, ~61% lines
npm run lint
npm run build:prod
```

Ports are fixed in the estate `PORTS.md`: **4203** this app, **4501** bff-business, **4602**
TickerHaus mock, **4873** local Verdaccio. Do not pick others; `estate-up.sh` and the smoke script
assume them.

Three serve configurations:

- `development` (default): `fixtureBackend: true`. Every request to the BFF and TickerHaus base
  URLs is answered in the browser by `src/app/core/fixture-backend/` from a deterministic
  `@meridian/domain-fixtures` dataset, seed `ledgerline`, ~120 ms latency. This is how most people
  work day to day because bff-business needs the Bedrock stubs and half the platform-services stack.
- `mock-external`: `fixtureBackend: false`, points at 4501 and 4602 from `mock-external/estate-up.sh`
  (or the real bff-business from `platform-services/`). Contract drift note: bff-business today
  serves `/api/v1/approvals`, `/api/v1/treasury/positions` and `/api/v1/entitlements/me`; the
  liquidity snapshot, positive pay and audit routes this app calls are in the Q4 backlog
  (PLAT-1402, tracked on our side as LDG-1211). Until they land only approvals works on the wire.
- `e2e`: fixtures with the clock frozen at 2024-11-15 14:30Z so Cypress screenshots and the
  "as of" labels are stable (LDG-1092). `npm run e2e:serve` then `npm run e2e` in a second shell,
  or `npm run e2e:ci` which waits on the port.

Production reads `/env.json` at bootstrap (`src/app/core/config/runtime-config.ts`), mounted by the
chart from `platform-tooling/helm/ledgerline-web`. The compiled production fallbacks are wrong on
purpose (LDG-1421). The `helm/` directory in this repository is the kind chart for local use only.

## Layout

```
src/app/
  app.config.ts            provideRouter, functional interceptors, APP_INITIALIZER for the session
  app.routes.ts            lazy feature routes, canMatch/canActivate functional guards
  core/
    auth/                  SessionStore (signals), guards, session initialiser
    api/                   one thin HttpClient class per BFF resource, inject() everywhere
    config/                APP_CONFIG token, runtime env.json overlay
    fixture-backend/       HttpInterceptorFn that answers from domain-fixtures when enabled
    http/                  correlation id + error normalisation interceptors
    models/                view models; wire types come from domain-fixtures
  canopy-compat/           local cn-filter-chips on the Material 16 chips API (LDG-1187)
  features/
    approvals/             queue, detail, decision dialog, risk flags; ApprovalsStore (signals)
    liquidity/             dashboard, positions, forecast, TickerHaus panel; DashboardFiltersStore
    entitlements/          list, detail, limits form
    positive-pay/          exceptions, bulk decision bar, detail dialog
    audit/                 server-paged table, filters, CSV export
    shell/                 cn-page-shell wrapper, session expiry, forbidden / not found
  shared/                  status badge, KPI tile, loading/empty/error states, pipes
  testing/                 TestBed providers for the fixture backend, page render helpers
```

About forty standalone components. Signals are used where state is shared across components
without a parent/child relationship (approvals pending count in the nav badge, dashboard filters);
everything else is plain inputs/outputs and `async`-free `*ngIf="x() as y"`. No NgRx, decided in
ADR-0001 and not reopened since.

## Canopy

`@meridian/canopy-ui@3.7.2` declares Angular 14 peer dependencies. We are on 16. Canopy 4 (Angular
16+, CNPY-2140) has been "next quarter" since Q1 2024. In the meantime:

1. `.npmrc` has `legacy-peer-deps=true` so `npm ci` installs at all. This is the *only* reason it
   is there; do not lean on it for anything else.
2. `patches/@meridian+canopy-ui+3.7.2.patch` is applied by `patch-package` in `postinstall`. It
   widens the peer ranges and rewrites the compiled `cn-list` template from the Material 14 list
   directives to the MDC ones, plus one symbol rename so the bundle links. Details, ownership and
   the removal condition are in `patches/README.md`. If `npm ci` prints `patch-package` errors the
   install is broken; do not `--ignore-scripts` past it.
3. `src/app/canopy-compat/filter-chips` reimplements `cn-filter-chips` on `mat-chip-listbox`
   because the Material chips API changed underneath it and a patch was not enough. Same inputs,
   outputs and classes as the Canopy component. `canopy-compat/README.md` has the rules.

Both 2 and 3 are on LDG-1187 and come out the day Canopy 4 is on Verdaccio. The Canopy team knows
and has reviewed the patch (design system sync, 2024-02-20).

Locally Canopy comes from the Verdaccio on 4873 (`@meridian:registry` in `.npmrc`); publish it with
`canopy-ui/scripts/publish-local-versions.sh`. The registry is `127.0.0.1`, not `localhost`, because
Node 18 resolves `localhost` to `::1` and the in-process Verdaccio listens on IPv4.

## Build tooling

Webpack via `@angular-devkit/build-angular:browser`. **esbuild** (`browser-esbuild`, then the
`application` builder in 17) was evaluated in LDG-1340 (March 2024): 2.3x faster cold build, but
the Canopy Sass entry points did not resolve through it and the `patches/` edits to the fesm
bundles were not picked up consistently. **Deferred** until Canopy 4, where it becomes the default;
notes are on the ticket. Do not re-evaluate before then, it is a known outcome.

Budgets in `angular.json` are 1.2 MB warn / 2 MB error on the initial bundle; Canopy plus Material
puts us around 1.05 MB gzipped 290 KB. Anyone adding a chart library reads LDG-1355 first.

## Testing

Jest with `jest-preset-angular`, jsdom. `src/app/testing/fixture-backend-testing.ts` provides the
full HttpClient + interceptor chain against a frozen fixture dataset, so specs render pages with
real data and no `HttpTestingController` choreography. Coverage gate is 58% lines in
`jest.config.js` and the Jenkinsfile; we sit around 61-62. The audit feature has no page specs
yet (LDG-1204), which is most of the gap.

Cypress: `cypress/e2e/a11y/` has two specs, dashboard and approvals, each with two `checkA11y`
calls on `wcag2a`/`wcag2aa`. `color-contrast` is disabled in both: every remaining hit is Canopy
brand green on white at 4.08:1 (shell header, `cn-badge` brand tone), owned by CNPY-2011 and fixed
in Canopy 3.8. When that lands re-enable the rule, it should be clean. Violations print as a table
in the runner log via `cy.task('table')`.

## Ops

- Runbook: `docs/runbooks/treasury-workstation.md`
- Dashboards: Splunk `ledgerline-web` app; the correlation id we send as `X-Correlation-Id` is
  what joins us to bff-business logs.
- Alerts page to treasury-digital 08:00-20:00 ET; overnight to the business channel duty rota.
- Release train: `release/2026.09`. We deploy with the train; hotfixes go through CAB like everyone
  else (CAB reference in the ticket, not in the commit).

## Known problems

- LDG-1187 Canopy 3.7.2 patch and chips reimplementation (above).
- LDG-1204 Audit view has no Jest page specs.
- LDG-1211 bff-business does not yet serve liquidity/positive-pay/audit; fixtures only.
- LDG-1811 TickerHaus streaming flag is off; polling every 15 s. Vendor reconnect bug.
- LDG-1340 esbuild deferred (above).
- `@angular/flex-layout` 15.0.0-beta.42 is installed only because Canopy 3.7.2 lists it as a peer;
  nothing under `src/` imports it. It is the last release ever and declares Angular 15 peers.
  Goes with Canopy 4 (LDG-1187); do not start using it.
