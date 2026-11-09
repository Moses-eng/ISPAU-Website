# Admin architecture

`src/main.tsx` mounts `src/app/App.tsx`. This checkout contains only the ISPAU administrator application. The public site and ISP portal remain on `main`.

## Ownership and reuse

- `app`: administrator entry and hash navigation; `/staff` is supported for existing links.
- `features/staff/pages`: overview, applications, review, members, finance composition, reports, administration and shared login.
- `features/staff/components`: staff accounts, password changes and activity tables.
- `features/staff/services`: account policies and audit projections.
- `features/membership`: membership models, application schema, reusable organisation/profile editors, billing controls, report builders and workflow rules needed by staff.
- `components/dashboard`: shared operational UI; no staff page logic.
- `components/layout`: the admin shell and logo.
- `services`: replaceable authentication, session, membership, audit and document adapters.
- `mocks`: local sample organisation records, not production customer data.
- `config`: permissions, admin navigation and environment settings.
- `styles`: Tailwind entry, theme and admin styles. Preserve import order unless reviewing the cascade.

Use default component exports and named model/data exports. Use `@/` imports in UI code. Pure domain modules and Node tests use explicit relative `.ts` imports so the existing test runner can execute them without a bundler.

## Roles and membership workflow

`config/permissions.ts` defines capabilities for Super Admin, Membership Admin and Finance Admin. Navigation, routes, workflow actions and exports apply the same rules. Super Admin sees all authorised sections; Membership Admin reviews and verifies applications, requests clarification, manages member profiles and activates approved paid memberships. Super Admin records admission decisions. Finance confirms receipt and manages billing documents. Finance snapshots exclude private application answers and evidence.

Applications, payment status, membership standing, portal access and directory publication remain separate. Payment evidence alone never activates membership. Activation requires approval and confirmed payment. Directory publication requires active membership, eligibility, profile approval and consent. Draft applications are excluded from staff queues. Domain models preserve these distinctions even though this branch has no applicant or public directory screens.

The local adapter uses `workspaceSnapshot(actor)` and `dispatch(actor, command)` in `membershipService`. Replace them with authenticated backend responses and mutations. Derive identity and enforce transitions on the server; client guards are interface behaviour, not security. Uploaded evidence is held in memory; refresh does not preserve file bytes. Production file access requires authorised private storage and download endpoints.

## Authentication and accounts

`staffAuthService` uses the in-memory account adapter only when `import.meta.env.DEV` is true and no `VITE_ADMIN_API_BASE` is configured. Production always uses the configured API, default `/api/admin`, with credentials included. The CSRF token is held in memory. Do not place passwords or tokens in Vite environment variables or browser storage.

All administrators use email/password followed by email OTP. Password success grants only a short-lived challenge; only successful OTP creates an authenticated staff session. Super Admin creates administrators by email and role, without temporary passwords. A single-use invitation opens password setup, then returns to sign-in with the email prefilled. Reset/resend uses a replacement invitation and revokes prior credentials, sessions and challenges. Account removal retains audit attribution. Existing account-management reauthentication and Super Admin safeguards remain.

See [administrator invitation and login](admin-authentication.md) for exact endpoint shapes, component connection points, preview instructions and server responsibilities. No live email service is bundled; local development displays an invitation email preview and uses OTP `123456`, while production always calls the configured backend.

## Audit and exports

`staffAuditService` records login, explicit logout, dashboard navigation, successful changes, account management and downloads. Super Admin has a global activity/session view. Membership and Finance have scoped activity histories including relevant Super Admin changes. Events include identity, role, timestamp, area, record reference and safe changed-field summaries; never credentials or copied private document contents. Browser closure does not invent a logout timestamp.

Browser-local events are not immutable. Production requires server-generated append-only audit events stored alongside successful transactions and authentication changes; no administrator may delete or edit them. The UI has no audit deletion action.

`features/membership/services/reports.ts` supplies the same exact table data to screens and PDF exports. `documentService` validates identity/scope and records successful downloads. `pdfRenderer` loads on demand and uses the ISPAU logo, burgundy branding, Unicode font and repeated table headers. Keep `public/fonts/LICENSE-DejaVu.txt` with the PDF font. Uploaded tax invoices and receipts retain their original files; generated proformas are non-tax documents and contain no invented bank instructions.

## Release boundary and checks

The pre-push cleanup on 9 November 2026 traced imports from the app, Vite configuration and tests; all remaining TypeScript files have consumers. It removed 31 obsolete CSS rules/selectors, seven unused icons, four unused theme properties, obsolete service methods and redundant authentication styles. Internal-only helpers/types no longer export unnecessary symbols. `noUnusedLocals` and `noUnusedParameters` now run with TypeScript, and the generated `.pnpm-store/` cache is ignored. Tests, PDF fonts/licence, deployment configuration and preview adapters remain because they support the current admin application.

`features/trade-credit` now provides the approved access/participation entry for Super Admin and Membership Admin. Finance is excluded. Complaint submission/review/withdrawal screens are a subsequent feature requiring separate approval. See [Trade Credit access and badges](trade-credit-access.md) for current rules and backend connection points.

`tests/admin-boundary.test.ts` prevents public-site, ISP-portal and legacy Trade Credit workspace screens from returning to this checkout. Other tests cover consequential workflow transitions, payment/activation separation, permissions, accounts, audit visibility and report/download scope. Run `pnpm check` before committing.
