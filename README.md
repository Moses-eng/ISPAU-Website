# ISPAU Staff Dashboard

Standalone administrator frontend on the `ISPAU-staff-dashboard` branch. Built with React 19, strict TypeScript, Vite 8 and Tailwind CSS 4.

## Run locally

Use Node.js 22.12+ or 24+ and pnpm 10.34.3. If pnpm is unavailable, install it with `npm install --global pnpm@10.34.3`.

```sh
git clone --branch ISPAU-staff-dashboard https://github.com/Moses-eng/ISPAU-Website.git ispau-admin
cd ispau-admin
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5180`. The Administrator login opens at `/`; `/staff` remains a compatible entry point. No `.env` file or backend is required for the development preview.

Sign in with the fictional Super Admin email `superadmin@ispau.example`, password `ISPAU-Preview-2026!`, then OTP `123456`. These credentials work only in development. Additional staff accounts can be created from Administration. Local accounts reset on refresh. Administrators receive a simulated password-setup invitation, then sign in with email/password and OTP. No temporary passwords are needed. See [administrator invitation and login](docs/admin-authentication.md) for the preview steps and backend contract.

## Run the public website and ISP portal alongside admin

Keep the admin terminal running. In a second terminal, clone the other branch into a separate folder:

```sh
git clone --branch main https://github.com/Moses-eng/ISPAU-Website.git ispau-site
cd ispau-site
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5174` for the public website or `http://127.0.0.1:5174/portal` for the ISP dashboard. Use `office@company5.example` and OTP `123456` for an active ISP preview; `office@company8.example` is another active ISP. The ISP server proxies Trade Credit requests to admin on port 5180, so both servers must run to preview complaint submission → admin verification → authorised references. The admin server keeps that shared preview in memory; restarting it resets complaints and attachments. No real emails are sent. Keep ports 5174 and 5180 free; the servers report an error rather than silently changing ports.

## Admin sections

- Overview: actionable membership and finance queues.
- Membership: applications, reviews, member records, directory management and email templates.
- Finance: billing, payment confirmation, invoices and activity history.
- Trade Credit: private complaint review, authorised-reference logs and ISP participation (Super Admin/Membership Admin).
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
    trade-credit/              Complaint review, reference contracts and access rules
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

Local membership data and audit records use replaceable browser adapters; authentication uses an in-memory development adapter only during development. Production authentication never falls back to test credentials. Server-enforced permissions, persistent records, private files, email delivery and append-only audit storage must be supplied by the backend. See [architecture](docs/architecture.md), [access and badges](docs/trade-credit-access.md), and [complaint flow/API contract](docs/trade-credit-complaints.md). `pnpm preview` serves a production build and therefore requires the production authentication API; use `pnpm dev` for the interactive mock login.
