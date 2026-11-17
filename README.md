# ISPAU Website

React 19, TypeScript, Vite 8 and Tailwind CSS 4 frontend for the Internet Service Providers Association of Uganda.

## Local setup

Use Node.js 22.12+ or 24+ and pnpm 10.34.3. If pnpm is unavailable, install it with `npm install --global pnpm@10.34.3`.

```sh
git clone --branch main https://github.com/Moses-eng/ISPAU-Website.git ispau-site
cd ispau-site
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5174`. No `.env` file or backend is required for the website and ISP login preview.

- `/` — public website
- `/portal` — ISP and applicant workspace

For an active ISP, sign in with `office@company5.example` and OTP `123456`; `office@company8.example` is another active ISP. Expand **Try the UI preview** on the login page to select a returning applicant instead. All credentials and organisations are preview fixtures. No real email is sent. Application drafts are stored in this browser; see [UI changes](docs/ui-changes.md) for the resume flow.

## Run the admin and connected Trade Credit preview

In a second terminal, clone the admin branch into a separate folder:

```sh
git clone --branch ISPAU-staff-dashboard https://github.com/Moses-eng/ISPAU-Website.git ispau-admin
cd ispau-admin
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5180`. The fictional Super Admin login is `superadmin@ispau.example`, password `ISPAU-Preview-2026!`, then OTP `123456`. Keep both servers running to exercise **ISP → Submit a complaint → admin verification → authorised ISP reference**. The ISP Vite server proxies `/api/trade-credit` to the admin development server. Ports 5174 and 5180 are fixed; free them if startup reports a conflict.

Complaints, attachments and reference logs live in the shared admin preview's memory and reset when that server restarts. Pending complaints are private to the reporting ISP and authorised admins. This is a UI/UX preview; backend authentication, durable storage, authorisation and email delivery still require integration. See [Trade Credit API contract](docs/trade-credit-complaints.md) and [access/badges](docs/trade-credit-access.md).

For another device on the same network, run `pnpm dev --host 0.0.0.0` and use the network address printed by Vite.

## Commands

- `pnpm check` — formatting, workflow tests, TypeScript and build
- `pnpm build` — production files in `dist/`
- `pnpm preview` — serve the production build
- `pnpm format` — format source files

## Structure

The `main` branch contains the public website and ISP portal. Staff administration is maintained on `ISPAU-staff-dashboard`, using the same shared components and services.

`src/app` handles route composition. The ISP portal is in `src/features/portal` and public pages are in `src/features/public`. Other domain logic lives in `src/features`; shared controls and layouts live in `src/components`. `src/config` contains navigation and feature settings, `src/services` contains data adapters, and `src/styles` contains Tailwind and shared theme rules. Imports beginning with `@/` resolve to `src/`.

The repository contains the frontend and local data adapters. Authentication, private storage, email delivery and persistent records require API integration. No secrets belong in client-side code.

See [architecture](docs/architecture.md) for module ownership. Static hosting must support SPA fallbacks for `/portal`.

See [UI changes and cleanup](docs/ui-changes.md) for the email/OTP and saved-application flow, preview controls and removed code. The [backend integration contract](docs/backend-integration.md) maps frontend connection points to proposed authentication, draft, file and membership APIs; these endpoints are not implemented yet.

Public company profiles now support crawlable URLs, per-profile metadata and generated HTML/sitemaps. See [profile SEO](docs/profile-seo.md) for the approved public export, domain configuration and publication/withdrawal deployment requirements. Indexing remains disabled until configured for the client's production domain.

Keep `pnpm-lock.yaml`, `.env.example`, `build/`, required public assets, tests and API documentation in the repository. `build/` contains source for profile generation; `dist/` is generated output and is ignored, along with dependencies, logs, local settings and private `.env` files. Use `pnpm dev` for the connected mock service; `pnpm preview` does not start the admin development adapter.
