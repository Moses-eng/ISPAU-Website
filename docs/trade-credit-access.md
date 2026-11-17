# Trade Credit access and badges

Approved UI feature 1, 9 November 2026. This supersedes older notes about manual Trade Credit provisioning or a separate Trade Credit staff role.

## Current behavior

- Trade Credit review access belongs to Super Admin and Membership Admin. Finance has neither the navigation item nor direct-route access. No new staff role is created.
- Verified ISP accounts enrol automatically. The preview represents verification by Active membership; an explicitly non-ISP organisation category is excluded. Legacy sample records without a category are treated as ISP records; the backend must return an authoritative verified-ISP entitlement.
- Current membership remains usable through its end date. Expired subscriptions pause Trade Credit until a Confirmed renewal invoice covers the current date. Uploading a receipt alone cannot restore access. Future paid periods do not unlock access early. The main ISP account, invoices and organisation settings remain available while Trade Credit is paused.
- The same eligibility selector drives the ISP gate and the admin participation list. No separate Trade Credit grant or officer-enrolment step is required. Accountable officer contact maintenance remains available without blocking an enrolled ISP.
- Navigation badges show outstanding action counts; the notification button shows unread alerts. Counts render only above zero. Reading an alert does not complete the action. An action disappears from the count when the underlying workflow state changes.
- Notification read state is local, scoped by actor and role. ISP notices/invoices are filtered to that organisation. Staff alerts use the assigned role; Finance cannot receive Trade Credit review alerts.
- Membership submissions, clarification responses, decisions, unpaid invoices, receipt confirmations and organisation notices supply alerts. Pending private complaints now supply the Trade Credit review count. Approval, clarification or decline completes that review task; reading its notification alone does not.

Approved UI feature 2 connects complaint submission, admin review and authorised references. See [complaint flow and API contract](trade-credit-complaints.md). Withdrawal/resolution notifications and independent dispute outcomes remain separate features.

## Backend connection points

`features/trade-credit/services/access.ts` computes preview eligibility. The backend should expose the equivalent entitlement, subscription-through date and restriction reason alongside the authenticated organisation/session response. Enforce it on every private Trade Credit endpoint. Confirm payment on the server before restoring access; do not rely on client dates or arbitrary invoice status edits.

`features/notifications/model.ts` projects authorised records into display-safe alerts and action counts. The existing adapters must eventually load only the permitted records; UI filters do not replace authorisation. Suggested connection contracts:

| Endpoint                         | Intended result                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /trade-credit/access`       | Current actor entitlement and reason; subscription end date.                                                |
| `GET /notifications`             | Scoped notification IDs, titles, summaries, destinations, timestamps and read state.                        |
| `PATCH /notifications/{id}`      | Persist `{ read: true }` for the authenticated recipient.                                                   |
| `POST /notifications/read`       | Mark the authenticated recipient's selected notifications as read.                                          |
| `GET /workspace/action-counts`   | Outstanding counts by authorised section; zero counts need no badge.                                        |
| `GET /trade-credit/review-queue` | Pending complaints for Super Admin/Membership Admin only, connected when the complaint feature is approved. |

The access and notification endpoints above remain proposed backend contracts. The separate public/ISP and admin development previews now share complaints through a development-only adapter, documented in the complaint contract. Date/status tests cover payment restoration, expiration boundaries, non-ISP exclusion, organisation isolation, Finance restrictions and read-versus-action counts.

Eligible ISPs receive anonymous reference-availability notices only after admin approval. Withdrawal/resolution notices must disclose no customer information publicly. Reading a notification must never silently approve, withdraw, settle or delete a complaint.
