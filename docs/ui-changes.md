# UI changes and cleanup

Updated: 8 November 2026. This checkout is a frontend prototype; it does not yet send emails or call a backend.

## Applicant and ISP access

- Replaced organisation workspace selection with official email followed by a six-digit OTP.
- Added six code boxes, numeric keyboard hints, full-code paste, browser autofill hints, focus movement, arrow navigation and Backspace support.
- Completing the code starts verification automatically; there is no verify button. A pending state prevents duplicate verification.
- Added change-email, resend cooldown, expiry and invalid-code feedback. The current preview uses a 30-second resend cooldown and 10-minute code lifetime.
- Draft applicants open `/portal#/application` immediately after sign-in. Other application stages open `/portal#/overview`; active ISPs see the member dashboard.
- Draft saves retain answers, evidence metadata, licence count and the current zero-based section in `values.resumeSection`. Save and exit saves first, signs out and returns to `/#login`.
- A valid official organisation email is required before a draft can be saved. This is `values.businessEmail`, distinct from applicant, representative and billing emails.
- Reduced desktop spacing. Authentication branding is hidden at widths of 900px or less so the form appears first. Very small screens, zoom or expanded preview details can still require scrolling; content is not clipped to force a fixed height.
- Removed redundant authentication instructions while preserving expiry and error guidance.

## Preview controls

`src/config/authPreview.ts` controls the simulated OTP and helper panel. The preview code is `123456`. A recognised official email opens its matching example organisation. An unrecognised email opens the sample draft, without changing its stored email; it does not create an account or application. Use the active ISP example to inspect member access.

Setting `authPreview.enabled` to `false` hides the helper panel and disables simulated OTP sign-in. It does not install real authentication. The sample records, local services and staff preview must also be replaced or excluded when connecting the backend. See [backend integration](backend-integration.md).

Saved application data uses browser local storage (`ispau-workspace-demo-v2`). The session and actual selected file bytes are held in memory. Reloading requires signing in again; saved file names may remain even when file bytes are no longer available. This is not cross-device persistence.

## Cleanup completed

The import graph was traced from the app entry point, Vite configuration and tests, resolving TypeScript aliases and lazy imports. Text searches confirmed the removed components had no consumers.

| Removed or simplified                                        | Reason                                                                                                                                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/PortalHeading.tsx` and its exclusive CSS  | Unreferenced component; live workspaces use `PageHeader`.                                                                                                                                                   |
| `src/features/auth/pages/Mfa.tsx`                            | Unreferenced staff MFA mock; staff registration remains on its own branch.                                                                                                                                  |
| `src/features/trade-credit/pages/TradePublic.tsx`            | Unreferenced promotional page; live private Trade Credit and public request/dispute flows remain.                                                                                                           |
| `TRADE_CREDIT_STATUSES` in `feature.ts`                      | Unused duplicate; the workflow model owns the live status definitions.                                                                                                                                      |
| Organisation selection in `DemoIdentity`                     | Superseded by email/OTP and could bypass that UI flow from the account dialog. Staff preview selection remains.                                                                                             |
| Optional standalone application mode                         | No callers existed. `MembershipApplication` now requires its workspace application and actor; one scoped store handles draft save and submission. The unused `ispau-membership-draft` fallback was removed. |
| Old `.otp-input` styles and hidden mobile branding overrides | Superseded by six boxes and complete mobile panel removal.                                                                                                                                                  |
| Unused invoice lookup and mandate icon binding               | Values were never consumed. Mandate numbering now uses the map index instead of a repeated search.                                                                                                          |

Added `noUnusedLocals` and `noUnusedParameters` to TypeScript checks. Ignored the generated `.pnpm-store/` package cache. Dependencies, lockfile, workflow tests, shared staff branch registration, existing reachable routes, public assets and currently used stylesheet rules were retained.

## Validation and handoff

Run `pnpm check` for formatting, workflow/permission tests, TypeScript and the production build. These checks do not prove browser layout or email delivery.

Manual acceptance checks when browser access is available:

1. Use the returning applicant example, paste `123456`, and confirm the application opens without a button press.
2. Edit answers on a later section, save and exit, reload, sign in with the saved official email and confirm the same answers and section reopen.
3. Use the active ISP example and confirm the member dashboard opens.
4. Enter an incorrect code, correct a digit, test Backspace/arrows, change email, resend and expiry. Confirm only one verification runs at a time.
5. At mobile widths, confirm the left panel is absent and all six boxes fit. Check keyboard access, focus, errors and screen-reader labels.
6. After real API integration, repeat on a different browser/device and verify files can actually be retrieved.
