# ADMIN Architecture

## Context

ADMIN is a multi-workspace enterprise frontend. It must support warehouse operations, administration, visitor management, reporting, authentication, and shared collaboration features without coupling every workspace to one large application service.

## Target boundaries

### Shell

The root shell owns bootstrap configuration, global theme loading, application update checks, and top-level routing. It must not contain domain workflows.

### Auth platform

`auth/` owns session state, token access, login/logout contracts, authorization decisions, and HTTP interceptors. Feature components may ask `AuthService` for permission checks, but must not read tokens or local-storage keys directly.

### Workspace domains

Each workspace owns its routes, screens, API contracts, facades, and domain state:

- `warehousemanagement/`: warehouse operations and warehouse NgRx state
- `adminv2/`: users, roles, permissions, applications, and navigation configuration
- `visitor-management/`: visitor entry, exit, and tracking flows

Workspace code may depend on `shared/` and `auth/`. Workspace code should not depend on another workspace's private components or services.

### Shared platform

`shared/` contains reusable building blocks only:

- `components/`: reusable UI primitives and compositions
- `layouts/`: page shells
- `services/`: cross-cutting integrations
- `config/`: application metadata and constants
- `utils/`: side-effect-free helpers

When a shared component contains domain-specific rules, move the rules into the owning workspace and keep the shared component generic.

## State strategy

| State                        | Owner                     | Technology                                 |
| ---------------------------- | ------------------------- | ------------------------------------------ |
| Component-local UI state     | Component                 | Angular signals                            |
| Derived UI state             | Component/computed facade | `computed()`                               |
| HTTP request lifecycle       | Service/facade            | RxJS                                       |
| Websocket/event streams      | Integration service       | RxJS                                       |
| Cross-route warehouse state  | Warehouse store           | NgRx                                       |
| Auth session and permissions | Auth platform             | Signals with a single persistence boundary |

## Dependency direction

```text
Shell ───────► Auth platform ───────► Shared platform
  │                  │                      ▲
  └──────────────► Workspace domains ──────┘
```

The dependency-cruiser gate prevents circular dependencies and importing test files into runtime code. Future boundary rules should be added as domains are extracted further.

## Operational concerns

- Keep environment-specific URLs and product metadata in environment files.
- Use lazy routes for large workspaces and export/reporting libraries.
- Add request correlation IDs and centralized error telemetry at the HTTP boundary.
- Avoid putting secrets in frontend configuration; all frontend configuration is public.
- Keep accessibility attributes and keyboard behavior in reusable components.
- Prefer server-side authorization as the source of truth; frontend permissions are a UX guard only.
