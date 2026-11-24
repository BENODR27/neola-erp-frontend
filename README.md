# Platform Frontend

Independent Docker deployment: [package setup and environment configuration](DEPLOYMENT.md).

Independent containers connect through your configured host IP and ports 5001–5006.
The independent Compose profiles do not require a shared external Docker network.

MMMS follows [MMMS-NEW.MD](../reqs/MMMS-NEW.MD). See [architecture](../docs/ARCHITECTURE.md), [developer setup](../docs/MMMS-GETTING-STARTED.md) and [coverage and gaps](../docs/MMMS-REQUIREMENTS-COVERAGE.md).

ADMIN is an enterprise operations platform built with Angular 22. The frontend currently contains the warehouse-management and administration workspaces, shared authentication, navigation, reporting, AI/chat, QR scanning, and reusable UI services.

## Quick start

Requirements:

- Node.js 24.15+ (Angular 22 supported runtime)
- npm 11+

```powershell
npm install
npm start
```

The development server runs at `http://localhost:4200`.

Useful commands:

| Command                      | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `npm start`                  | Run the development server                            |
| `npm run build`              | Create a production build                             |
| `npm run test:ci`            | Compile and run headless tests                        |
| `npm run lint`               | Run Angular ESLint                                    |
| `npm run format`             | Format supported source and documentation             |
| `npm run format:check`       | Verify formatting without changing files              |
| `npm run architecture:check` | Detect circular dependencies and runtime test imports |
| `npm run validate`           | Run the complete local quality gate                   |

## Configuration and rebranding

Product metadata and branding are defined in [src/app/shared/environments/environment.ts](src/app/shared/environments/environment.ts) and exposed through [src/app/shared/config/app-config.ts](src/app/shared/config/app-config.ts). Update these values to rebrand or configure a deployment:

- application name, short name, description, company name
- release version and default browser title
- logo, compact logo, and favicon paths
- support email and API endpoints

Cross-cutting storage keys, routes, and shared asset identifiers belong in [src/app/shared/config/app-constants.ts](src/app/shared/config/app-constants.ts). Do not duplicate these values in feature components.

## Application design

```text
src/app
├── auth/                  Authentication session, token interceptor, 401 handling
├── adminv2/               Administration workspace and access management
├── warehousemanagement/   Warehouse workflows, NgRx warehouse state, reports
├── visitor-management/    Visitor-management workspace
└── shared/
    ├── components/        Reusable UI and feature-aware presentation components
    ├── config/            App metadata and cross-cutting constants
    ├── environments/      Build-time deployment configuration
    ├── layouts/           Shells for workspace composition
    ├── services/          HTTP, storage, notifications, theme, chat, websocket
    └── utils/             Shared pure helpers and export utilities
```

### Runtime flow

1. `main.ts` bootstraps the standalone Angular application.
2. `app.config.ts` registers routing, HTTP interceptors, NgRx, effects, and devtools.
3. The auth interceptor adds the access token to API requests.
4. The response interceptor handles expired sessions and redirects to login.
5. Lazy-loaded workspace modules keep the initial bundle small.
6. Signals represent local reactive UI state; RxJS remains the boundary for HTTP, websocket, and event streams; NgRx owns shared warehouse state.

## Agent architecture

The project is designed for a small, specialized engineering-agent workflow. Agents should work in this order and keep ownership boundaries explicit:

```text
Product / task request
        │
        ▼
Planner agent ──► Architecture decision record / task slice
        │
        ├──► Domain agent       Feature behavior, APIs, state
        ├──► UI agent           Components, accessibility, responsive UX
        ├──► Platform agent     Config, auth, performance, build tooling
        └──► Quality agent      Tests, lint, architecture, release checks
                         │
                         ▼
                 npm run validate
```

Agent rules:

- One agent owns one bounded feature slice at a time.
- Shared services and configuration require an architecture note before changing their public API.
- Feature code must not import another feature's internals; use shared contracts or a domain service.
- API contracts and environment values must not be hard-coded in templates.
- Every behavior change adds or updates a focused test.
- The final handoff includes changed files, validation commands, known limitations, and a rollback note.

## Engineering standards

- Strict TypeScript and strict Angular templates are enabled.
- Angular signals are preferred for component-local state and derived UI state.
- Standalone components are the default for new UI; legacy NgModules remain isolated while being migrated.
- API access goes through typed services and the shared HTTP layer.
- Components should stay presentational; orchestration belongs in services, facades, or store effects.
- New dependencies require a clear capability, license/security review, and bundle-size consideration.
- Use `npm run format:check`, `npm run lint`, and `npm run architecture:check` before review.

## Documentation

- [Architecture and boundaries](docs/ARCHITECTURE.md)
- [Implementation roadmap](docs/ROADMAP.md)

## Known limitations

- Some legacy screens still use NgModules and broad `any` models; they are migration candidates, not blockers for new feature work.
- The Karma builder is retained for compatibility with the current test suite. A future task should move tests to the Angular 22 application test builder or a Vite-native runner.
- Existing third-party PDF/export packages produce CommonJS optimization warnings. They should be isolated behind lazy services before tightening bundle budgets.

# frontend-v1

# neola-erp-frontend
