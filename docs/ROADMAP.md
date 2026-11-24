# Platform Delivery Roadmap

Existing deployables now have per-folder `compose.independent.yaml` files and
runtime-configurable frontend API proxies; see the
[independent deployment guide](../../docs/INDEPENDENT-DEPLOYMENT.md). These remove
sibling startup coupling while retaining existing combined profiles. The confirmed
six-package design intentionally keeps Home, IAM, Masters, MMMS and WMS together
in this ERP frontend. Each deployable owns its environment templates, deployment
guide and `docker:*` commands; workspace frontend extraction is outside this scope.

Masters now has separate lazy pages for Organization, Units, Currencies, Employees, Contacts and Vendors. Each owns its component/template/styles and explicit editor; shared request and table controls retain server pagination, theme tokens and IAM permissions. See [page structure and menu migration](../../docs/SHARED-MASTERS.md#dedicated-catalog-pages).

Organization setup is further split into nine independent pages: Companies, Business units, Factories, Buildings, Floors, Departments, Sections, Lines and Locations. Each has a fixed record type, per-page read/manage permissions, server pagination and validated scoped parent selection. IAM/provider migrations register the navigation and permissions without rewriting existing grants or commercial snapshots.

The [IAM workspace](../../docs/IAM-ACCESS.md) is restored inside ERP for user, role and company/factory access management, with purchased permission/seat limits enforced by the server. Commercial plans, subscriptions and approvals stay in the independent console, whose duplicate ERP employee/customer-role/migration screens have been removed. Menus remain database-driven through IAM.

The independent [NeoLA Subscription Console](../../docs/SUBSCRIPTION-MANAGEMENT.md) owns commercial plans/trials/manual approvals and can take over ERP access management after an explicit per-installation cutover. ERP employee identity and runtime menus remain served by IAM. MMMS and shared Masters are verified locally. Legacy IAM adoption/rollback, security recovery/MFA, invoices, scheduled renewals and key rotation are implemented and integration-tested. Additional ERP domain adapters remain release work. Common hierarchy, people, units, currencies, contacts and vendors are owned by the independent [Masters workspace](../../docs/SHARED-MASTERS.md).

NeoLA's product direction is an end-to-end **Apparel & Textiles ERP**. The woven-thread brand is shared across the application. Future ERP domains should retain independent feature/API ownership and shared IAM/storage boundaries; enabled modules and verified functional coverage remain the source of truth for available capabilities.

MMMS operational lists now use [server pagination](../../docs/MMMS-PAGINATION.md), including independent histories, shared vendors, report rows and dashboard tasks.

Shared appearance now provides Light, Dark, System and account defaults, with explicit vendor/customer branding membership in IAM. Components consume shared CSS tokens; see [appearance contracts](../../docs/PLATFORM-APPEARANCE.md). MMMS lists use a common pager, and its searchable How to use page follows the accepted server workflows.

MMMS now has connected workflows across the five maintenance phases. See [workflow tests](../../docs/MMMS-TESTING.md) and [customization](../../docs/MMMS-CUSTOMIZATION.md). The unchecked items below concern the wider shared platform; MMMS acceptance evidence is recorded in its coverage guide.

MMMS scope comes from [MMMS-NEW.MD](../../reqs/MMMS-NEW.MD). Follow its five phases and track actual gaps in [requirement coverage](../../docs/MMMS-REQUIREMENTS-COVERAGE.md). The MMMS backend exists and live data is the default. Keep related feature TypeScript together and reuse shared identity, shell and storage for additional apps. See [architecture](../../docs/ARCHITECTURE.md).

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
