# MMMS Frontend Progress

Last updated: 2026-11-10

This is the working checklist for the Smart Machine Maintenance Management System frontend. The preview UI is intentionally mock-backed so screens can be reviewed before the separate MMMS Node service is connected.

## Access

- Development preview: `/mmms-preview`
- Protected application route: `/mmms`
- Mock mode: enabled in the development environment through `mmmsUseMockData`
- API target reserved for integration: `MMMS_API_URL`

## Frontend module status

| SRD area | Preview route | Status | Current coverage |
| --- | --- | --- | --- |
| Dashboard and reporting | `/mmms-preview` and `/mmms-preview/reports` | Done - mock UI | KPI cards, uptime, downtime, maintenance mix, report cards |
| Machine master management | `/mmms-preview/machines` | Done - mock UI | Machine register, search, status, uptime, service date |
| Preventive maintenance | `/mmms-preview/preventive-maintenance` | Done - mock UI | Schedule, frequency, next due, compliance, owner |
| Breakdown management | `/mmms-preview/breakdowns` | Done - mock UI | Events, downtime, category, root cause, status |
| Work order management | `/mmms-preview/work-orders` | Done - mock UI | Priorities, assignments, workflow status, due context |
| Spare parts management | `/mmms-preview/spare-parts` | Done - mock UI | Stock, reorder levels, suppliers, low-stock state |
| Cost management | `/mmms-preview/costs` | Done - mock UI | Labor, parts, contractors, total, trend |
| Mobile maintenance | `/mmms-preview/mobile` | Preview scaffold | Technician queue and sync state; device actions pending |
| QR code management | `/mmms-preview/qr-management` | Preview scaffold | Asset cards and scan context; scanner pending |
| Production integration | `/mmms-preview/production-integration` | Preview scaffold | Orders, lines, downtime, units at risk, recovery state |

## Architecture completed

- [x] Feature boundary under `src/app/mmms`
- [x] Lazy-loaded MMMS route
- [x] Protected `/mmms` route using the shared AuthGuard
- [x] Development-only `/mmms-preview` route for UI testing
- [x] Typed MMMS models and facade boundary
- [x] Mock data for every preview screen
- [x] OnPush operations component and signal-backed screen state
- [x] Separate backend target kept behind `MMMS_API_URL`
- [x] Named MMMS page permissions seeded for the AuthGuard `ADMIN` role
- [x] MMMS workspace application and navigation catalog seeded
- [x] Permission guard attached to protected MMMS child routes

## Next implementation slices

- [ ] Add focused component/facade tests for every module
- [ ] Replace mock methods with MMMS API contracts one resource at a time
- [ ] Add create/edit/detail flows for machines, work orders, PM plans, breakdowns, and parts
- [x] Add server-permission names and navigation visibility rules
- [ ] Implement PDF/Excel report downloads
- [ ] Implement mobile photo, voice note, signature, and offline queue flows
- [ ] Implement QR generation/scanning and machine deep links
- [ ] Connect production orders and calculate production loss from real downtime
- [ ] Add accessibility and keyboard-navigation coverage

## Validation

The focused TypeScript and ESLint checks pass for the MMMS feature and application routes. Full runtime validation is still pending the MMMS backend API and the focused UI test suite.
