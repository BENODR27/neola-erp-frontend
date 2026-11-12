# Frontend agent instructions

This Angular 22 app already owns authentication, the shared shell, Admin v2, and WMS. MMMS is an additional protected workspace module.

## Commands

- `npm start` — local Angular development server.
- `npm run build:test` — fast development build.
- `npm run validate` — formatting, lint, architecture check, and production build.
- `npm test` — unit tests.

## Architecture

- Add MMMS code below `src/app/mmms`.
- Keep routes lazy-loaded and guarded with `authGuard`.
- Use `AuthService` and `AuthInterceptor`; never add a second token store.
- Components consume a typed feature facade. HTTP and API URL details stay in the facade/service layer.
- New components use signals and `ChangeDetectionStrategy.OnPush`.
- Register AuthGuard v2 application navigation with key `mmms` and landing route `/mmms` when backend navigation is ready.
- The MMMS API service lives in the sibling `mmms-backend` folder and defaults to `MMMS_API_URL=http://localhost:7010/v1`.

## MMMS next slices

1. Replace `MmmsFacadeService` demo data with authenticated HTTP calls.
2. Add machine register, detail, and QR routes.
3. Add work-order lifecycle screens matching the SRD.
4. Add PM schedules, breakdown capture, and spare-parts alerts.
5. Add focused tests and API contract tests before enabling live data by default.
