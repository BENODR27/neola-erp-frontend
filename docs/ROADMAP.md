# ADMIN Delivery Roadmap

This roadmap is based on the current codebase after the Angular 22 upgrade. It is intentionally sequenced so each phase leaves the application buildable.

## Phase 1 — Platform baseline

- [x] Angular 22 dependency baseline
- [x] Central app metadata, branding, routes, and storage constants
- [x] Auth service, token interceptor, and 401 handling
- [x] Strict TypeScript and Angular template checks
- [x] Prettier, Angular ESLint, Husky, lint-staged, and architecture checks
- [ ] Move the Karma builder to the Angular 22 test builder
- [ ] Add CI with install, lint, architecture, build, and test jobs

## Phase 2 — Domain boundaries

- [ ] Introduce typed API request/response contracts per workspace
- [ ] Add workspace facades so components do not call low-level HTTP services directly
- [ ] Extract shared navigation into a typed application-navigation domain
- [ ] Add route-level authorization guards and server-permission failure states
- [ ] Replace remaining broad `any` values in auth, warehouse, and admin contracts

## Phase 3 — Signals and performance

- [ ] Convert component-local mutable state to signals and `computed()` values
- [ ] Apply `ChangeDetectionStrategy.OnPush` to legacy components in bounded batches
- [ ] Replace manual subscriptions with `takeUntilDestroyed()` or signal interop
- [ ] Lazy-load PDF, Excel, chart, and scanner dependencies behind feature routes
- [ ] Establish bundle budgets per workspace rather than one global budget

## Phase 4 — Reliability and operations

- [ ] Add HTTP correlation IDs, structured client logging, and error telemetry
- [ ] Add contract tests for authentication and critical warehouse endpoints
- [ ] Add accessibility checks and keyboard-navigation tests
- [ ] Add smoke tests for login, workspace navigation, receive/issue flows, and logout
- [ ] Add dependency/license/security scanning to CI

## Definition of done

A feature is ready when it has a typed contract, an explicit owner, accessible UI, focused tests, no new lint or architecture violations, documented configuration, and a successful `npm run validate` result.
