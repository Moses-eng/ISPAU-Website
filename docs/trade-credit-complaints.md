# Private complaints and approved references

Approved UI/UX feature, 9 November 2026. No real complaint emails are sent and no production database or backend authentication has been implemented by this feature.

## Using the preview

1. Open the ISP portal, sign in as an active ISP, and choose **Trade Credit → Submit a complaint**.
2. Enter the business customer, contract, invoice references/due dates, payment history, outstanding balance/currency, reminders/customer response, and supporting evidence. PDF/JPG/PNG files are required; up to ten files, 10 MB each.
3. Submit once. The ISP sees the saved complaint and its review state. Only its own organisation and Super Admin/Membership Admin can read the complaint and evidence. Other ISPs receive no pending-complaint notice or customer identity.
4. In the admin app, choose **Trade Credit → Awaiting verification → Review complaint**. Download the evidence, record findings and choose Approved, Clarification needed or Declined. Approval requires customer/contract, invoice/evidence, outstanding-position and customer-notice checks. Recording a notice check does not send a notice/email; it confirms a notice has been checked.
5. Approval removes the review task and makes the record available to eligible ISPs through **References**. Enter the exact business name, purpose and authorisation. Both matches and no matches are logged. Results contain only case ID, business customer, reviewed status, outstanding balance/currency and update time. Other ISPs never receive contracts, evidence, reminders, reporting-ISP identity or personal contacts through a reference response.
6. Member notices announce an approved case reference/status/date without naming the customer. Notification read state remains actor-scoped in the browser; zero counts have no badge. Reporting ISPs receive their own review outcome and findings. Clarification is an outstanding ISP action.

Clarification/decline keep the complaint private. A reporting ISP's payment update returns the complaint to verification and removes reference availability until fresh approval. Dispute intake removes availability and records the contested status; independent-review outcomes, complaint withdrawal and settlement/withdrawal broadcasts are not part of this approved increment. The earlier public customer-request and satisfactory-history screens remain local prototype flows and are not connected to this new review adapter.

## Shared development connection

The ISP app runs on `http://127.0.0.1:5174`; the admin app must run on `http://127.0.0.1:5180`. The ISP Vite configuration proxies `/api/trade-credit` to the admin development server. `build/tradeCreditPreview.ts` holds the common records, evidence bytes and request log in server memory. This works across the two browser origins without putting private complaints into shared browser storage.

The middleware uses fake actor/eligibility headers **only in development** to exercise the UI. They are not credentials or a security boundary. The production client sends only same-origin session credentials, with no preview identity headers; the middleware is not included in the production app. The backend must implement the endpoints below. Do not deploy the Vite development server as the production service.

Browser reloads retain submitted complaints while the admin development server stays running; restarting it resets the entire preview, including attachments and logs. Refresh polls every five seconds. Use fictional test records only. The local adapter performs no email delivery, customer verification or durable audit storage.

## Backend connection contract

Client entry point: `src/features/trade-credit/services/complaintApi.ts`. Shared UI types and review rules: `services/complaints.ts`. API paths are relative to `/api/trade-credit`:

| Method and path                          | Request                                                                     | Response / scope                                                                                                                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /complaints`                        | Authenticated session                                                       | `{ records, notices, searches }`. ISP records/searches are organisation-scoped; notices contain only approved case IDs/status/dates. Reviewers get the queue/history/log. Finance/public users are denied.              |
| `POST /complaints`                       | `ComplaintInput` plus preview-only `attachments: { [evidenceId]: base64 }`  | Saved complaint, `201`. Stage is always under verification and approved is false. The server generates owner, IDs, date and activity. Production should replace base64 with private multipart uploads or upload tokens. |
| `GET /complaints/{id}/evidence/{fileId}` | Session                                                                     | Private download for reporting ISP or authorised reviewer only. Never a public URL.                                                                                                                                     |
| `POST /complaints/{id}/review`           | `{ outcome, note, identity, invoices, balance, notice, expectedUpdatedAt }` | Reviewed complaint. Only Super Admin/Membership Admin. Required checks for approval; stale/duplicate reviews rejected. Clarification/decline never expose the complaint.                                                |
| `POST /complaints/{id}/update`           | `{ history, balance }`                                                      | Owned complaint returned to private verification; activity added, previous approval removed.                                                                                                                            |
| `POST /complaints/{id}/dispute`          | `{ reason }`                                                                | Owned complaint marked contested and removed from reference availability pending independent review.                                                                                                                    |
| `POST /references`                       | `{ customer, purpose, authorised }`                                         | `{ query, results }`; query has ID, requesting organisation, purpose, time and matched case IDs. Results use the six-field allowlist above. Every request is audited before responding, including no match.             |

The backend must derive actor/roles/verified ISP status and current paid subscription from its authenticated session on every endpoint. Do not accept ownership, approval, eligibility or role from request bodies/preview headers. Apply organisation/role checks before reading documents or returning records, validate file contents and limits, store files privately, protect writes against CSRF, and return consistent permission/validation/conflict errors. The UI currently displays an error response's `{ message }` and preserves submission form contents when a request fails.

Use a transaction for the complaint, review decision, audit event and resulting scoped notifications. Approval should notify eligible ISP recipients without broadcasting customer identities, plus the reporting ISP with its own outcome. Pending submissions notify only authorised reviewers. The case timeline records actor/time/findings; the admin staff log records decision/ID without copying sensitive complaint contents. Replace preview polling with the backend's polling or event delivery and persist notification reads server-side.

Do not publish Trade Credit data in the public directory, SEO metadata, sitemap, analytics payloads or exports. Public ISP profile SEO remains an independent approved-publication flow.

## Verification

Domain tests cover pending isolation, both reviewer roles, Finance exclusion, expired-member rejection, validation/evidence requirements, approval checks, clarification/decline privacy, stale/repeated decisions, contested claims, no-match audit logging and the reference-field allowlist. Browser testing used a fictional complaint with a PDF attachment: submission → admin task → unavailable reference → evidence download/checks → approval → available scoped reference.
