# Frontend agent instructions

Read ../AGENTS.md, ../reqs/MMMS-NEW.MD, ../docs/ARCHITECTURE.md and docs/ROADMAP.md. MMMS-NEW.MD supersedes the old MMMS requirement and mock-only instructions.

This Angular app hosts MMMS, WMS, Admin v2 and the shared shell. Preserve the existing applications.

- Keep MMMS under src/app/mmms with lazy guarded routes and existing AuthGuard permission names.
- Reuse AuthService, AuthInterceptor and the shared shell. Never add a separate login or token store.
- Runtime application menus come only from the authenticated IAM workspace catalog through SharedServiceService. Do not add feature menu arrays, cached-menu restores or fallback menu catalogs. Keep static Angular component routes and permission guards. Run npm run test:navigation when changing catalog resolution.
- Keep each screen's TypeScript, template and styles together. Use typed models and facade calls; components do not call low-level HTTP directly.
- Prefer signals and OnPush for new components. Use direct feature methods; avoid new state frameworks or generic component engines.
- Put resource metadata in mmms.config.ts and deployment endpoints in shared/environments. Connect business configuration to real server validation.
- Use live MMMS APIs by default. Do not display successful local changes until the server accepts a write. Show API failures and meaningful empty/loading/saving states.
- All operational metrics must be measured from data. Do not use sample metrics in live screens.
- Keep stable relationship IDs when editing records. Historical maintenance records must remain traceable.
- Share attachments through storage-service; keep maintenance rules in mmms-backend.
- Use shared ThemeService and --app-* tokens for fonts, text, surfaces, borders and navigation. Keep screen layouts scoped. Never restore universal font weights or descendant color overrides in styles.css. Shared vendor/customer branding belongs to IAM appearance accounts; it does not grant data access. See ../docs/PLATFORM-APPEARANCE.md.
- Reuse MmmsPagination for long operational lists, reset pages when filters change, and keep the how-to page aligned with accepted server workflows.
- Operational lists use facade.getPage and server totals, never a downloaded collection sliced in the browser. Keep relationship selectors independent, preserve full exports and dispose pager requests through DestroyRef. Device-only queues retain local slicing. See ../docs/MMMS-PAGINATION.md.
- npm start runs the UI; npm run validate runs formatting, lint, architecture and production build. Add focused tests for changed business behavior.
- Update ../docs/MMMS-REQUIREMENTS-COVERAGE.md with verified coverage and remaining gaps. A screen alone does not complete a workflow.
