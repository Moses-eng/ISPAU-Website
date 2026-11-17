# ISPAU Staff Dashboard

Standalone administrator frontend on the `ISPAU-staff-dashboard` branch. Built with React 19, strict TypeScript, Vite 8 and Tailwind CSS 4.

## Run locally

Use Node.js 22.12 or later and pnpm 10.34.3.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed by Vite. The Administrator login opens at `/`; `/staff` remains a compatible entry point. In local development, expand **Local development access** on the login page for the test Super Admin credentials. Additional staff accounts can be created from Administration. Local accounts reset on refresh; first-time password setup skips email verification codes during local testing.

## Admin sections

- Overview: actionable membership and finance queues.
- Membership: applications, reviews, member records, directory management and email templates.
- Finance: billing, payment confirmation, invoices and activity history.
- Reports: permission-scoped tables and PDF downloads.
- Staff activity: login, logout, navigation, changes and downloads.
- Administration: staff accounts, roles and membership settings.

Super Admin, Membership Admin and Finance Admin use the same login. Their assigned permissions control available sections and actions. The public website and ISP portal are maintained on `main` and are not included in this branch.

## Source folders

```text
src/
  app/                         Admin entry and navigation
  features/
    staff/                     Admin pages, account controls and audit views
    membership/                Records, forms and workflow used by administrators
    trade-credit/feature.ts    Disabled future-module boundary
  components/
    dashboard/                 Tables, dialogs, badges, PDF controls and timelines
    layout/                    Admin layout and ISPAU logo
    ui/                        Buttons, icons and navigation toggle
  config/                      Permissions, navigation and deployment settings
  hooks/                       Admin state and responsive hooks
  services/                    Authentication, session, data, audit and document adapters
  mocks/                       Local example records
  styles/                      Theme, shared primitives and admin styles
  types/                       Membership field models
public/                        ISPAU logo and licensed PDF font
 tests/                        Workflow, role, account, report and boundary checks
```

Membership models include application and public-profile fields because administrators review and manage those records. They do not include public pages or member portal screens.

## Checks

```sh
pnpm check
```

This runs formatting checks, targeted tests, TypeScript and the production build. Use `pnpm format` to format changes and `pnpm preview` to inspect the production build.

## Deployment and backend

Deploy `dist/` to the administrator subdomain with an SPA fallback to `index.html`. See [.env.example](.env.example). `VITE_PUBLIC_SITE_URL` optionally enables the external public-site link; no public website files are bundled. Production authentication defaults to `/api/admin`, configurable with `VITE_ADMIN_API_BASE`.

Local membership data and audit records use replaceable browser adapters; authentication uses an in-memory development adapter only during development. Production authentication never falls back to test credentials. Server-enforced permissions, persistent records, private files, email delivery and append-only audit storage must be supplied by the backend. See [architecture](docs/architecture.md) for integration details. Trade Credit screens and routes are excluded from this release.
