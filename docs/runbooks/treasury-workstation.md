# Runbook: ledgerline-web (treasury workstation)

Owner treasury-digital. Pager 08:00-20:00 ET weekdays, business channel duty rota otherwise.
CMDB APP-11204. Dashboards: Splunk app `ledgerline-web`. This is a static bundle behind nginx; if
the page loads and the API calls fail, the problem is almost never here.

## Quick checks

1. `https://<env>/treasury/healthz` returns 200 from nginx. If not, the pods are down; check the
   `ledgerline-web` deployment in `cswt-business-<env>`.
2. `https://<env>/treasury/env.json` returns the ConfigMap content with the right `apiBaseUrl`.
   If it returns the built-in defaults (`/api/business`), the ConfigMap mount is missing; see
   LDG-1421.
3. Open the app, sign in, look at the network tab: `GET /api/v1/session` should return 200 with an
   `X-Correlation-Id`. Take that id to Splunk `index=cswt_business sourcetype=bff-business`.

## Symptoms

### Blank page after sign-in, console shows `NullInjectorError`

A provider missing from `app.config.ts`. Has happened twice with Material modules that Canopy
expects to be imported by the app (`MatSnackBar`, LDG-1160). Roll back the release; it is a build
defect, not an environment one.

### Approvals badge shows a number but the queue is empty

The badge comes from `ApprovalsStore.pendingCount`, which the shell refreshes on load; the queue
page filters by the operator's entitlements. Almost always the operator lost `payments:approve`
between the two calls (entitlements refresh is 60 s cached in the BFF). Not a defect; tell the
client admin to check entitlements. If it persists past the cache window, raise with
business-digital.

### "Rates unavailable" in the FX panel

TickerHaus mock (or the real feed via the markets gateway in prod) is not answering. The panel
degrades on its own and retries every 15 s. Check `GET /v1/fx/pairs` against the markets base URL.
If pairs come back but rates do not, the pair codes are wrong: the feed wants `EURUSD`, not
`EUR/USD` (LDG-1176, fixed in 2024.11.1; if you see it again the runtime config has an old
`marketsBaseUrl`).

### Positions "as of" shows hundreds of days ago

Only in local/e2e. The fixture clock is pinned by `fixtureAsOf`. In production this means the BFF
returned a stale snapshot; that is a Bedrock adapter problem, escalate to platform-services.

### Session expires while the operator is typing

Idle timeout is 15 minutes in dev/uat, 10 in prod (GIS-STD-014). The countdown in the toolbar
warns at 2 minutes. The app does not extend the session on activity by design; if a client asks,
point them to the standard.

### axe violations in the Cypress stage

Only `color-contrast` is suppressed and only for Canopy's brand green (CNPY-2011). Anything else is
ours. The runner prints a table with the first failing selector. Do not add rule exclusions to get
the build green without a ticket.

## Deploy and rollback

Deployed by the release train through `meridianNodePipeline`, chart
`platform-tooling/helm/ledgerline-web`. Rollback is `helm rollback ledgerline-web <rev>`; the image
is immutable and `env.json` comes from the chart, so a rollback is safe on its own. There is no
database.

The `helm/` directory in this repository is the kind chart for local use and is not deployed.

## Local

```
nvm use && npm ci && npm start
```

If `npm ci` fails in `postinstall` with a patch-package error, read `patches/README.md`. If it
fails resolving `@meridian/*`, Verdaccio on 4873 is not up or Canopy 3.7.2 has not been published
into it (`canopy-ui/scripts/publish-local-versions.sh`).

## History

- 2024-03-12 INC-208113: UAT pointed at the dev BFF for two days after a values file copy-paste.
  Led to LDG-1421 (wrong-on-purpose fallbacks) and quick check 2.
- 2024-06-04 INC-211470: TickerHaus feed outage, panel degraded correctly, no client impact.
  Alert threshold on `fx.unavailable` events raised from 1 to 5 minutes afterwards.
- 2024-11-19 Canopy 3.7.2 republish (CNPY-2177) changed the patch hunks; `npm ci` broke on every
  laptop for an afternoon. Regenerated the patch, no production impact.
