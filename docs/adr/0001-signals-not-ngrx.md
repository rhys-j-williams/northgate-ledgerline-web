# ADR-0001: Component state with signals and services, not NgRx

Status: Accepted, 2023-11-08. Treasury digital design review TD-DR-2023-14.
Owners: treasury-digital (T. Nakamura, R. Delacroix). Reviewed by CSWT architecture (W. Tanaka).
Supersedes: none.

## Context

ledgerline-web is the carve-out of the treasury screens from business-web (LDG-1001). business-web
is Angular 14 with NgRx 14 for everything: approvals, accounts, entitlements, the lot. The store
there is 61 reducers, 300-odd actions and a `state.ts` nobody wants to own. The carve-out was the
first chance in years to decide this again rather than inherit it.

Constraints that mattered:

- Angular 16.2 is the target. Signals are developer preview in 16 but the primitives (`signal`,
  `computed`, `effect`) are stable enough that the Angular team is building on them, and `inject()`
  plus standalone components are fully supported.
- The screens are read-mostly. The only state that genuinely crosses feature boundaries is the
  pending approvals count (nav badge) and the dashboard filters (shared by tiles, table, chart).
- The team is four engineers. Ceremony has a real cost.
- We wanted a clean Angular 17/18 upgrade path; the business-web NgRx 14 to 16 upgrade took
  business-digital six weeks (MBZ-2231) and we did not want that debt on day one.

Options: (a) NgRx as in business-web; (b) NgRx ComponentStore only; (c) plain services with
RxJS `BehaviorSubject`s; (d) signal-backed stores in `@Injectable` services, RxJS only at the HTTP
edge.

## Decision

(d). Shared state lives in small `@Injectable({ providedIn: 'root' })` or route-provided classes
exposing `signal`s and `computed`s (`ApprovalsStore`, `DashboardFiltersStore`, `SessionStore`).
Components read them directly in templates. HTTP stays RxJS and is converted at the boundary with
`toSignal` or a plain `subscribe` in the store method. No global store, no actions, no effects
library; the Angular `effect()` primitive is allowed for side effects such as persisting filters.

Route-scoped stores (`DashboardFiltersStore` is provided in the liquidity route) reset when the
user leaves the route. Root stores hold only what must survive navigation.

## Consequences

- Less code. The approvals feature is 1,100 lines including tests against 2,900 in business-web
  for the equivalent screens.
- No time-travel devtools. We have not missed them; the Splunk correlation id has been the more
  useful debugging tool.
- Signals in 16 are developer preview: `toSignal` requires an injection context, `effect()`
  cannot write signals without `allowSignalWrites`. Both bit us once (LDG-1120, LDG-1155). The
  17 upgrade removes the preview label and adds `input()`; the plan is to adopt that then rather
  than pre-empt it.
- Testing: stores are plain classes and test without TestBed. Page specs render against the
  fixture backend instead of mocking a store, which is what pushed the coverage up.
- If a screen ever needs genuinely event-sourced state (the audit view was the candidate, it did
  not), revisit with ComponentStore per feature. Do not introduce global NgRx.

## Notes

Reopened once, informally, in March 2024 when the positive pay bulk decision needed optimistic
updates across the table and the decision bar. Solved with a `computed` over the store and a
rollback on error. Not enough to reopen the ADR.
