# Architecture

`src/main.tsx` mounts `src/app/ApplicationRoot.tsx`. Public pages use `PublicShell`; `/portal` uses the shared `WorkspaceShell`. The staff branch registers `/staff` against the same shell.

## Module ownership

- `src/app`: route composition and workspace entry.
- `src/features/portal`: applicant and ISP pages.
- `src/features/staff`: ISPAU administration pages on the staff branch.
- `src/features/membership`: shared forms, records and membership workflow.
- `src/features/trade-credit/workspace`: payment records, verification, references and disputes.
- `src/components`: shared UI, navigation, tables, dialogs and layouts.
- `src/config`: navigation and feature settings.
- `src/services`: replaceable data adapters.
- `src/mocks`: example records.
- `src/styles`: Tailwind entry, theme and application styles.
- `tests`: workflow and permission checks.

Use default exports for components and named exports for data and types. Keep domain logic out of shared UI. Preserve stylesheet import order in `src/styles/index.css`.

ISP tools are common across organisations, while private records remain scoped by organisation. Staff sections retain their action permissions when grouped in navigation. Trade Credit participation requires explicit ISPAU provisioning. Public directory views use approved profile fields only.

API integration must enforce permissions, validate transitions, protect files and persist audit records on the server. Keep transport code in data adapters so UI components remain reusable.

`src/app/workspaceModules.ts` is the branch registration point. It does not import staff screens on `main`; the staff branch registers those screens without duplicating the public site or portal.
