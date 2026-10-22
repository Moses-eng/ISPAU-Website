# ISPAU Website

Frontend for the Internet Service Providers Association of Uganda, built with React, TypeScript, Vite and Tailwind CSS 4.

## Run locally

Install Node.js 22.12 or later, then run:

```sh
git clone https://github.com/Moses-eng/ISPAU-Website.git
cd ISPAU-Website
npm install --global pnpm@10.34.3
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by Vite, normally http://localhost:5173. No API keys, environment file or backend server are needed to view the frontend.

To view the site from a phone or tablet on the same network, run `pnpm dev --host 0.0.0.0` and open the network address Vite prints. The development computer must allow that connection through its firewall.

## Commands

| Command             | Purpose                                           |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Start development with automatic reload           |
| `pnpm check`        | Check formatting, TypeScript and production build |
| `pnpm typecheck`    | Check TypeScript without generating files         |
| `pnpm build`        | Create the production site in `dist/`             |
| `pnpm preview`      | Preview the production build locally              |
| `pnpm format`       | Format source, styles and documentation           |
| `pnpm format:check` | Check formatting without changing files           |

## Project layout

```text
src/
  app/          Application entry and route composition
  components/   Shared UI elements and page layouts
  config/       Navigation configuration
  features/     Pages, components and data grouped by feature
  hooks/        Shared React hooks
  styles/       Tailwind entry, theme and application styles
  types/        Shared TypeScript models
public/         Logos and other static assets
docs/           Architecture and backend integration notes
```

The feature folders cover the public website, company directory, authentication, membership applications, member portal, billing, administration and deferred Trade Credit work.

Use shared components such as `Button`, `NavigationDropdown`, `MenuToggle`, `SectionTitle` and `CompanyLogo` instead of copying their markup. Keep feature-specific components and data with their feature. Imports beginning with `@/` resolve to `src/`.

Tailwind runs through the Vite plugin. Shared design tokens and existing custom styles live in `src/styles/`. Keep the stylesheet import order when changing layouts.

## Current scope

This is a frontend demonstration. Member listings, authentication, invoices and workflow actions use sample data and browser state. Client-side roles do not authorize real data access. Trade Credit remains disabled until its separate release.

Company logos are included in the repository. Photography and web fonts load from external services and need an internet connection. Search-engine indexing is disabled until public launch.

See [architecture](docs/architecture.md), [backend integration](docs/backend-integration.md) and [responsive checks](docs/responsive-qa.md).
