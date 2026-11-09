# Backend integration contract

Updated: 8 November 2026.

**Status:** proposed integration contract, not implemented endpoints. The frontend currently uses sample data, local storage and in-memory services. Paths below use `/api/v1` as a proposed base; the backend team can agree equivalent names while preserving these behaviors.

## Frontend connection points

| Area                     | Current code                                                                                                | Backend work                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email challenge          | `src/features/auth/pages/Login.tsx`: `sendCode`                                                             | Replace local timers with an OTP request; use the returned challenge ID and server deadlines.                                                                                       |
| OTP verification         | `Login.tsx`: `verify`, `beginVerification`                                                                  | Replace `123456`, local email matching and the 450ms delay with one asynchronous verification request. Keep the pending lock until the request settles.                             |
| Code entry               | `src/features/auth/components/OtpInput.tsx`                                                                 | Keep as UI. `onComplete(code)` triggers verification; typing, paste and autofill use the same path. Do not connect separate requests to each box.                                   |
| Session                  | `src/services/demoSession.ts`, `src/hooks/useMembershipWorkspace.ts`                                        | Replace simulated actor selection with session bootstrap, server-issued identity and logout. Add a loading state before deciding the user is signed out.                            |
| Route after sign-in      | `src/app/DashboardApp.tsx`: `signIn`; `Login.tsx`: `verify`                                                 | Load the authorised application summary first; Draft goes directly to the form, other stages to overview. Consolidate these two current routing decisions around the server result. |
| Draft load/save          | `src/services/membershipService.ts`; `src/features/membership/pages/MembershipApplication.tsx`: `saveDraft` | Replace local persistence with authenticated reads and revision-aware saves. Await durable success before displaying Saved or navigating away.                                      |
| Submission               | `MembershipApplication.tsx`: `confirmApplicationSubmission`                                                 | Submit the saved revision, surface server field errors and navigate only on success.                                                                                                |
| Organisation email edits | `src/features/portal/pages/OrganisationDetailsEditor.tsx`; application `businessEmail` field                | Separate draft contact edits from changes to the verified login identity. Require verification of a replacement sign-in email.                                                      |
| Files                    | `src/features/membership/services/files.ts`, `src/components/dashboard/EvidencePreview.tsx`                 | Replace in-memory file maps/object URLs with private upload IDs, scan status and authorised download URLs.                                                                          |
| Member data              | `membershipService.ts`, `src/features/portal/pages/*`                                                       | Fetch organisation-scoped records, invoices, membership, profile and renewal data; persist mutations.                                                                               |
| Public directory         | `membershipService.publicProfiles`, `src/hooks/usePublicDirectory.ts`                                       | Serve only eligible, active, approved and consented public fields.                                                                                                                  |
| Trade Credit             | `src/features/trade-credit/workspace/service.ts`                                                            | Replace memory-only commands and requests with scoped endpoints and server audit events.                                                                                            |

Introduce transport adapters under `src/services` rather than embedding fetch calls throughout components. Existing dispatch calls are synchronous: changing the adapter alone is insufficient. Each caller must await requests and handle pending/error states. Keep `Application`, `Actor`, `FileRecord` and `Command` in `src/features/membership/types/workspace.ts` as the current UI shape; map API DTOs at the adapter boundary.

## Email OTP and session endpoints

| Method and path                                           | Request                                                     | Response / UI behavior                                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/otp/challenges`                               | `{ "email": "office@isp.example", "intent": "sign-in" }`    | `202` with `{ challengeId, expiresAt, resendAvailableAt }`. Show code entry. Use `intent: "sign-up"` for a separately designed new applicant path. |
| `POST /auth/otp/challenges/{challengeId}/verify`          | `{ "code": "123456" }`                                      | `200` with server identity and application summary; establish session. The value here is an example, never a production bypass code.               |
| `POST /auth/otp/challenges/{challengeId}/resend`          | No email change                                             | `202` with replacement `{ challengeId, expiresAt, resendAvailableAt }`; reset all boxes. Invalidate the previous code.                             |
| `GET /auth/session`                                       | Session cookie                                              | `200` with the same identity/application summary; `401` if signed out. Bootstrap on reload.                                                        |
| `DELETE /auth/session`                                    | Session cookie                                              | `204`; clear local private state and return to sign-in. Save and exit calls this only after a successful save.                                     |
| `POST /auth/email-change/challenges`                      | `{ "email": "new@isp.example" }` from an authenticated user | Send verification to the new official email; keep the existing login email active until verification completes.                                    |
| `POST /auth/email-change/challenges/{challengeId}/verify` | `{ "code": "..." }`                                         | Update the verified identity and official organisation email atomically, then return updated session data.                                         |

Suggested verification/session response:

```json
{
  "actor": {
    "id": "user-42",
    "name": "Example ISP Ltd",
    "kind": "organisation",
    "roles": [],
    "organisationId": "org-42"
  },
  "application": {
    "id": "app-42",
    "stage": "Draft",
    "resumeSection": 3,
    "revision": 7,
    "updatedAt": "2026-11-08T10:30:00Z"
  }
}
```

The application summary above is an API DTO. The current UI stores `resumeSection` as a string inside `Application.values`; map numeric API values to/from that shape until the UI type is migrated. Do not expose other organisations' records in a session bootstrap response.

The server should own OTP generation, validation, expiry, attempts, resend limits and one-time consumption. The preview currently displays 10 minutes and 30 seconds; return actual deadlines so UI and server stay aligned. Give challenge requests a consistent response shape to avoid revealing account existence. Never return a real code to the browser, store it in local storage or log it. Autofill hints are already present; delivery-app autofill still depends on the browser/device.

Recommended session transport is a server-managed `HttpOnly`, `Secure` cookie with an appropriate `SameSite` policy. Configure CSRF protection for mutations and explicit trusted origins if the API is hosted separately. Resolve organisation/roles from the session, never the submitted `actor` object. Cookie/session handling is backend work; the current actor object is only a preview UI identity.

### New applicant provisioning

There is no real account/application creation today. Unrecognised emails in preview mode open the sample draft; they are not registered. Backend integration must replace this fallback with an explicit sign-up flow: verify the official email, create an organisation and a single draft transactionally, then open section 0. Existing applicants must be resolved by verified identity and returned to their own existing draft. An unknown sign-in email must never inherit sample or another organisation's records.

The existing `EmailVerification`, `PasswordRecovery` and `ResetPassword` routes are reachable legacy UI states, not working authentication. Applicant/member access now uses OTP. Decide whether those routes become redirects to OTP or belong to a separately implemented staff flow; do not wire password recovery into applicant OTP access accidentally. Staff registration remains separate in `src/app/workspaceModules.ts` and requires its own backend permissions.

## Draft, evidence and submission endpoints

| Method and path                                     | Purpose                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /applications/current`                         | Return the authenticated organisation's complete application, saved values, resume section, evidence metadata, stage and revision.                        |
| `PATCH /applications/{id}/draft`                    | Save partial answers, current section, licence count and uploaded evidence IDs. Permit incomplete drafts; validate data types, ownership and Draft stage. |
| `POST /applications/{id}/evidence`                  | Multipart upload with category and actual bytes; return a server file ID and scan status.                                                                 |
| `DELETE /applications/{id}/evidence/{fileId}`       | Remove authorised evidence from a draft.                                                                                                                  |
| `GET /applications/{id}/evidence/{fileId}/download` | Authorised download or short-lived private URL; never a public bucket URL.                                                                                |
| `POST /applications/{id}/submit`                    | Validate all required fields/evidence/declarations, freeze the submitted version, record the transition and queue acknowledgement.                        |

Suggested draft save:

```http
PATCH /api/v1/applications/app-42/draft
Content-Type: application/json
If-Match: "7"
```

```json
{
  "values": {
    "legalName": "Example ISP Ltd",
    "businessEmail": "office@isp.example",
    "applicantName": "Example applicant",
    "licenceEntries": "1"
  },
  "resumeSection": 3,
  "evidenceIds": ["file-42"]
}
```

Return `200` with the updated application, numeric `resumeSection`, `revision: 8` and server `updatedAt`; return an ETag matching the revision. Treat `values` here as a merge of supplied fields, allow empty strings/false to clear values, and replace the evidence association list only when `evidenceIds` is supplied. Document and enforce allowed fields. Reject stale `If-Match` with `412`, reload the latest record and let the user resolve changes rather than overwrite another tab/device.

`resumeSection` is zero-based, limited to 0–7: Organisation information, Membership fit, Licensing & PDPO, Representatives & authority, Billing & customer contact, Supporting evidence, Interests & public profile, Declarations & review. See `applicationSectionNames.ts` for the current ordering. Consider stable section identifiers and a form schema version before changing that ordering.

Submission can use `{ "revision": 8 }` with an idempotency key and return the updated application in Submitted stage. Validation rules currently live in `membershipFormSchema.ts` and `services/validation.ts`; implement equivalent authoritative server rules. Do not require every field to save a partial draft. Submitted applications are read-only except explicitly permitted clarification workflows.

Files currently accept PDF/JPG/PNG up to 10 MB and persist metadata only. Server uploads must check actual file contents, size, ownership, private storage and scan results. A successful local selection is not a successful upload. Keep pending uploads visible and prevent submission until required evidence is durably accepted. Saving filenames alone cannot restore uploads on another device.

### Save and resume sequence

1. Read the session and authorised current application after successful OTP verification.
2. For Draft, fetch values/evidence and mount the form at its saved section; avoid rendering an empty form first.
3. Save draft sends values, evidence IDs and section with the current revision.
4. Save and exit awaits that save, then ends the session. On failure, remain on the form with the answers intact and a retry action.
5. A later sign-in repeats steps 1–2, including from another browser/device.
6. Active members open overview. Submitted/review/payment stages also open overview/status rather than an editable draft.

Current limitation: `membershipService.dispatch` catches local storage failures and keeps data in memory. Its Saved UI is not proof of durable persistence. Replace this behavior with an awaited successful server response before promising cross-session recovery. The existing form has an error branch ready for a rejected save, but the adapter must propagate failures.

## Errors and pending behavior

Use a consistent body, for example:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Check the highlighted information.",
    "fields": { "businessEmail": "Enter a valid official organisation email." },
    "requestId": "request-42"
  }
}
```

Suggested mappings: `400 OTP_INVALID`, `410 OTP_EXPIRED`, `429 RATE_LIMITED` with `Retry-After`, `401 SESSION_REQUIRED`, `403 ACCESS_DENIED`, `409 APPLICATION_NOT_EDITABLE`, `412 REVISION_CONFLICT`, `413 FILE_TOO_LARGE`, `415 FILE_TYPE_UNSUPPORTED`, `422 VALIDATION_FAILED`, and retryable server/network failures. These are proposed application conventions, not current behavior.

Preserve form answers and allow retry on network failure. Reset the verification lock in `finally`; cancel or ignore stale responses after email changes/unmount. Return failed code entry to an editable focused box. Session expiry should route back through sign-in and then restore the authorised application; it must not clear a saved draft.

## Other existing backend surfaces

These are additional connection areas, not implemented routes. Domain commands and permission tests are the current source of expected behavior.

| Proposed resource                                                                                    | Current source / operations                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /directory`, `GET /directory/{memberId}`                                                        | `publicProfiles`; approved public data only.                                                                                                                            |
| `GET /membership`, `PATCH /organisation`, `PATCH /organisation/profile`, `POST /membership/renewals` | Member workspace; `details`, `profile`, `renew` commands. Profile publication still needs its separate approval/consent gates.                                          |
| `GET /invoices`, `POST /invoices/{id}/payments`                                                      | Billing workspace; payment reference/date/receipt; confirmation and activation are separate staff actions.                                                              |
| `POST /applications/{id}/clarification-response`                                                     | Applicant `respond` command.                                                                                                                                            |
| Staff application/review/decision/billing/activation resources                                       | Shared `Command` union and `workflow.ts`. Derive actions from server roles; `main` does not register staff screens. Preserve audit history and state transition checks. |
| Trade Credit enrolment, cases, evidence, notices, disputes and reference searches                    | `workspace/model.ts` command union and tests. Enforce active membership, explicit provisioning, purpose declarations and record isolation on every operation.           |
| `POST /customer-record-requests`                                                                     | `CustomerRequests.tsx` and `creditService.request`; acknowledge a request without disclosing private records.                                                           |

## Integration acceptance checklist

- Disable/remove `authPreview` code verification, unrecognised-email fallback, sample data and staff identity selection in the connected deployment.
- Verify sign-up creates one draft; returning applicants resume their own saved section without extra navigation; active ISPs reach their dashboard.
- Confirm real email delivery and that expired, consumed, incorrect or throttled codes fail server-side.
- Test session reload/logout/expiry, concurrent tabs, stale saves, network failures and save-before-exit ordering.
- Confirm evidence bytes survive reload/device changes and private files cannot be fetched by another organisation.
- Verify identity/email changes cannot redirect login to an unverified address.
- Run `pnpm check` and add API integration tests for authentication, persistence, authorisation and uploaded evidence. Existing frontend tests alone do not establish backend security or persistence.
