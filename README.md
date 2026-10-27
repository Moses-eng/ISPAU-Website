# ISPAU Website

React 19, TypeScript, Vite 8 and Tailwind CSS 4 frontend for the Internet Service Providers Association of Uganda.

## Local setup

Use Node.js 22.12 or later and pnpm 10.34.3.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the address printed by Vite, normally `http://localhost:5173`.

- `/` — public website
- `/portal` — ISP and applicant workspace

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
