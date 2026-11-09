# Administrator invitation and login

Updated 9 November 2026. Implemented on `ISPAU-staff-dashboard`; the public site and applicant/member OTP flow remain on `main`.

## UI flow

1. Super Admin opens Administration → Create administrator, enters an email and selects a role. No temporary password or required display name is collected. Existing Super Admin password confirmation is retained for account-management actions.
2. Creation queues a password-setup invitation. The account shows Invitation pending. The local adapter displays an email preview with a Set your password button instead of sending email.
3. The invitation opens `/#/password-setup?token=...`. The page validates the link before showing New password and Confirm password.
4. Passwords must match and contain 8–128 characters, including a letter, number and symbol. The link is single use and expires after 24 hours in the preview adapter.
5. Successful setup removes the token from the URL and returns to login with the email prefilled and password field focused. Setup does not grant a dashboard session.
6. Correct email/password produces an email OTP challenge for every administrator role, including Super Admin.
7. Six code boxes accept paste and autofill hints, keyboard movement and correction. The sixth digit begins verification without a button. Only a successful code response establishes the session and opens the authorised dashboard.
8. Code errors, expiry, resend cooldown, invalid invitation links, duplicate accounts and mismatched passwords have feedback. A pending lock prevents duplicate form/code requests.
9. Reset/resend sends a new setup link and invalidates the old password, sessions, invitations and pending login challenges. Account removal retains audit attribution.

Authentication pages hide their branding panel at mobile widths (900px or less). No member/public pages were imported into the standalone admin checkout. The code-entry component lives under staff components.

## Local preview

Run `pnpm dev --host 127.0.0.1 --port 5180` in the staff checkout. Development uses the local adapter only when no `VITE_ADMIN_API_BASE` is configured.

- Super Admin email: `superadmin@ispau.example`
- Super Admin password: `ISPAU-Preview-2026!`
- Login OTP: `123456`

Create an administrator, then use Set your password inside the preview invitation email. This opens in the same tab and signs out the current Super Admin to demonstrate the invited administrator's journey. Continue without refreshing: local accounts, passwords, invitation tokens and OTPs are held in memory and reset on reload. No email is sent, and the local invitation will not work in another tab/device. Real delivery and cross-device setup require the backend endpoints below.

Production never uses the local fixed code, seed account or invitation-email preview. It uses the configured API, default `/api/admin`. Password hashing in the local adapter exists only to exercise the UI and tests; production credential handling belongs on the server.

## Backend connection contract

These are frontend adapter contracts; this change does not implement a backend or email sender. Requests include cookies; authenticated mutations retain the existing in-memory CSRF token header.

| Endpoint relative to API base              | Request                                                | Expected response                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /staff/accounts`                     | `{ email, role, confirmationPassword }`, optional name | `{ account, delivery: "queued" }`. Create a pending account and send an invitation containing the setup link. Never return an invitation token or password to the creator. |
| `POST /staff/accounts/{id}/reset-password` | `{ confirmationPassword }`                             | `{ account, delivery: "queued" }`. Revoke access/challenges and queue a replacement setup link. Also serves pending invitation resend.                                     |
| `POST /auth/password/invitation`           | `{ token }`                                            | `{ email, expiresAt, purpose: "invitation" \| "reset" }`. Validate bearer token and return the verified invitation email; do not trust an email from URL parameters.       |
| `POST /auth/password/setup`                | `{ token, password }`                                  | `204`. Revalidate and atomically consume the token, save the credential, activate the account and invalidate older sessions/challenges. Do not establish a login session.  |
| `POST /auth/login`                         | `{ email, password }`                                  | `{ challenge: { id, email, expiresAt, resendAvailableAt } }`. Password success alone must not return a fully authenticated session.                                        |
| `POST /auth/login/verify`                  | `{ challengeId, code }`                                | `{ actor, accountVersion, csrfToken? }`. Consume the OTP, establish the authenticated session cookie and return assigned permissions.                                      |
| `POST /auth/login/resend`                  | `{ challengeId }`                                      | `{ challenge: { id, email, expiresAt, resendAvailableAt } }`. Replace the old challenge/code and enforce resend limits.                                                    |
| `GET /auth/session`                        | Session cookie                                         | `{ actor, accountVersion, csrfToken? }` only for sessions that completed OTP.                                                                                              |
| `POST /auth/logout`                        | Session cookie                                         | `204`; invalidate the session.                                                                                                                                             |
| `POST /auth/password`                      | `{ currentPassword, password }`                        | `204`; change own password and revoke sessions. The client returns to sign-in and requires OTP again.                                                                      |
| `GET /staff/accounts`                      | Authenticated Super Admin                              | `StaffAccount[]`; metadata only, never secrets.                                                                                                                            |
| `PATCH /staff/accounts/{id}`               | `{ name, email, role, confirmationPassword }`          | Updated account; verified login email cannot be silently replaced.                                                                                                         |
| `DELETE /staff/accounts/{id}`              | `{ confirmationPassword }`                             | Removed account metadata; retain audit history and invalidate sessions/tokens.                                                                                             |

Account metadata keeps the existing shape: `{ id, name, email, role, status, createdAt, lastLoginAt?, credentialVersion }`. Roles remain `super_admin`, `membership_admin` and `finance_admin`; Setup required renders as Invitation pending. `lastLoginAt` is updated after successful OTP, not password submission. The local adapter adds `previewInvitation` to its own delivery response solely for the simulated email UI; the API adapter deliberately discards that field in production.

The adapter accepts error bodies `{ error: { message } }` or `{ message }`. Suggested status cases include invalid/used/expired link, incorrect/expired OTP, attempt limit, resend throttling, duplicate email, password policy failure and insufficient permissions. Return useful messages without disclosing whether unauthenticated emails exist.

## Server responsibilities

- Generate opaque invitation tokens, send button links to the intended email, expire/consume links once and invalidate replacements atomically. Do not include passwords in email, URLs or audit events.
- Hash passwords on the server and enforce the policy there, independently of UI validation.
- Bind OTP challenges to password-verified accounts and credential versions. Enforce expiry, attempts and resend limits. The preview uses 10-minute codes, 30-second cooldown and five incorrect attempts.
- Issue a full session only after OTP. Enforce role/organisation scope and session revocation server-side; browser state is not authorisation.
- Protect cookies/CSRF, rate-limit public authentication routes, and write durable audit records for invitations, setup, resets, successful login and access changes.
- Do not bundle local preview credentials or use `123456` in the connected deployment. Use the development adapter only for UI review.

## Validation

`pnpm check` runs formatting, existing membership/permission/audit/report tests, new invitation/OTP account tests, TypeScript and the build. The account tests cover role gating, missing temporary credentials, one-use links, link expiry/replacement, password requirements, OTP-first session gating, resend/attempt limits, removed-account access and password/session revocation.

Browser acceptance: exercise the complete preview journey without reload, verify prefilled email, confirm no dashboard before OTP, test incorrect/mismatched/expired states and verify the mobile panel is hidden. Real email delivery, cross-device setup and session cookies need backend integration tests.
