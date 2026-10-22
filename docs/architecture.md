# Architecture

## Application flow

`src/main.tsx` imports the global styles and mounts `src/app/App.tsx`. App composes feature pages and manages hash navigation, demo sessions and the selected directory member. `src/types/View.ts` defines the available routes.

Public pages use `PublicShell`, which supplies the shared header and footer. Signed-in workspaces use `Portal`, which supplies role-specific navigation and the responsive drawer.

## Reuse and ownership

- `components/ui/`: buttons, form fields, icons, section headings and menu toggles.
- `components/layout/`: public and portal layouts and the reusable navigation dropdown.
- `config/navigation.ts`: public links and dropdown items.
- `hooks/useMediaQuery.ts`: shared breakpoint subscription and cleanup.
- `features/<feature>/`: the pages, data, components and utilities owned by that feature.
- `types/`: models shared across multiple features.

Components have default exports. Data and types use named exports. Use the `@/` alias for imports from `src/`. Shared UI must not depend on feature pages. Keep domain data and transport logic out of shared UI.

## Styling

`styles/index.css` imports Tailwind, design tokens and the stylesheets in their cascade order. `responsive.css` contains the final breakpoint adjustments. Theme colours are available as Tailwind utilities, including `bg-brand`, `text-brand` and `bg-brand-tint`.

Use shared components and Tailwind utilities for new interface work. Keep custom rules for complex selectors and existing design details. Changing stylesheet import order can change the cascade.

## Navigation and demo state

Routes use URL hashes such as `/#home`, `/#membership` and `/#directory`. Unknown routes fall back to Home. Demo role requirements are defined in App. Company selection is held in memory; a future integration should encode stable profile IDs in URLs.

The Trade Credit feature flag is in `features/trade-credit/feature.ts`. Its pages and data remain within that feature but its routes are unavailable while the flag is false.

## Production

`pnpm build` checks TypeScript and creates static files in `dist/`. Deploy those files to a static web host. Backend services can be integrated later without changing the static asset structure. The public directory is copied into the build, so company logos require no external storage service.
