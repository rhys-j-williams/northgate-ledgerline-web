# ADR-0002: In-browser fixture backend as the default local and test data source

Status: Accepted, 2024-02-14. Supersedes the "run bff-business locally" guidance in the original
carve-out runbook.
Owners: treasury-digital (R. Delacroix). Consulted: business-digital (bff-business), QE chapter.

## Context

bff-business needs Keystone, entitlements-service, the Bedrock adapter and its stubs to start. On a
laptop that is `estate-up.sh` plus fifteen minutes plus the Redis question. Most front-end work does
not need it. Before this ADR every engineer had a different local setup: two used a hand-rolled
Express stub, one used `HttpTestingController` in tests and `json-server` in dev, one ran the full
stack. Test data was copy-pasted JSON that drifted from the wire shapes, and QE found three
defects in 2023 Q4 that were the fixture being wrong rather than the app (LDG-1041, LDG-1058,
LDG-1066).

`@meridian/domain-fixtures` had just gained the treasury segment (PLAT-1180): deterministic
customers, accounts, payments, entitlements and audit events from a seed, with the guarantees the
data classification standard wants (Luhn-failing cards, test routing number, `@example.com`).

## Decision

A functional `HttpInterceptorFn` (`src/app/core/fixture-backend/`) answers every request to the BFF
and TickerHaus base URLs from a dataset built by `generateFixtures` with `segmentMix.treasury = 1`.
It is registered only when `environment.fixtureBackend` is true, which is the `development` and
`e2e` build configurations and every Jest spec. It is never in the production bundle: the
interceptor is spread into the provider list conditionally at module evaluation, and the
production environment file has `fixtureBackend: false`; tree shaking removes the rest.

The same dataset builder serves Jest (via `src/app/testing/fixture-backend-testing.ts`) and
Cypress. Seeds differ per consumer (`ledgerline`, `ledgerline-spec`, `ledgerline-e2e`) so a spec
cannot accidentally depend on a value the dev server happens to show. The clock is frozen for tests
(`fixtureAsOf`) and live for `npm start` so relative dates read sensibly.

The fixture backend implements the BFF contract as documented, including error envelopes,
correlation id echo and 401 on sign-out. It is not allowed to grow behaviour the BFF does not
have; if the BFF does not do it, raise a PLAT ticket.

## Consequences

- One data source for dev, unit and e2e. The three 2023 Q4 "fixture drift" defect classes have
  not recurred.
- Page-level Jest specs became cheap, which is most of why coverage is where it is.
- The interceptor is ~250 lines of routing code that has to track the BFF contract. It has drifted
  once already (LDG-1211: the BFF landed on `/api/v1` and grew fewer routes than the contract
  said). It is a cost we accept; it is far smaller than the stubs it replaced.
- Anyone reading the network tab in dev sees requests that never leave the browser. This confused
  two new joiners and is now in the onboarding notes.
- Latency is simulated at 120 ms flat. Loading states are therefore exercised, timeouts are not.
  The `mock-external` configuration against the real mocks remains the place to test those.
