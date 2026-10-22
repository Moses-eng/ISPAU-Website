# Backend integration handoff

This is a frontend prototype. Current data and interactions demonstrate workflows; they do not establish an API contract.

| Area           | Current frontend                                       | Integration needed                                                              |
| -------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Authentication | Demo roles in sessionStorage and simulated sign-in/MFA | Server sessions, credentials, email verification, password resets and MFA       |
| Authorization  | View guards in App                                     | Server-side role and resource authorization on every endpoint                   |
| Membership     | Form schema and local state                            | Application persistence, validation, workflow transitions and audit history     |
| Directory      | Typed sample members in feature data                   | Member listing, filtering, profile retrieval, publication and stable IDs        |
| Billing        | Sample invoices and client-generated proforma          | Authoritative invoices, payment reconciliation, receipts and download endpoints |
| Uploads        | Frontend input and demonstration states                | File storage, upload limits, validation, malware scanning and access control    |
| Administration | Local queues and simulated actions                     | Review decisions, permissions, email templates, delivery and audit logs         |
| Trade Credit   | Disabled feature                                       | Separate future release; retain server-side gating before enabling              |

Shared existing models live in `src/types/`. `PublicMember` is a display model, and `MembershipApplicationValues` is currently a loose form-value map. Agree request/response DTOs with the backend team before turning these into persisted records.

When integration starts, place API clients and response mapping inside the owning feature (for example `features/membership/api/`). Add shared HTTP configuration only when endpoints and authentication requirements are agreed. Keep transport concerns out of shared UI components and map server responses to view models.

For each connected screen, handle loading, empty, validation, permission, retry and server-error states. Replace hard-coded status changes with server-confirmed transitions. Treat all currency totals, workflow decisions and role checks as server responsibilities.

The sessionStorage role key `ispau-demo-role` is for demonstrations only. It must never authorize real data access. Company selection, navigation and form state currently follow the export's local behaviour and are not durable storage.

Do not put secrets in frontend environment variables. Vite variables exposed to client code are public. There are no API credentials or required environment variables in the current app.
