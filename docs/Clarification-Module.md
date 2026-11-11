
---

## 2 — `app/Modules/Clarification/README.md`

```markdown
# Clarification Module (Membership)

Admin-managed module for **raising clarification requests** on a membership
application and recording the applicant's consolidated response. Designed
for the "one open request at a time" workflow: a reviewer raises a request
with a subject + checklist, the applicant responds once, then the reviewer
either accepts, rejects or closes it.

Built on the same layered-modular-monolith pattern used by
**Application**, **Reviewer**, **Verification**.

`Clarification` is a **satellite** of `Application`:

- **No auth flow of its own** — uses the existing `admins` guard.
- **Foreign keys** — `application_id` cascades on delete.
- **Snapshot fields** — `reviewer_name` and `assigned_by_name`.
- **Auto status transition** — raising a request moves `Submitted` /
  `Under review` applications into `Clarification needed`; a response
  moves them back into `Under review`.
- **Checklist items** — stored as JSON for lightweight, flexible prompts.

---

## Architecture

```bash
app/Modules/Clarification/
├── Controllers/
│   └── ClarificationController.php
├── DTOs/
│   ├── ClarificationRequestData.php
│   ├── ClarificationResponseData.php
│   └── ClarificationActionResponseData.php
├── Interfaces/
│   └── ClarificationServiceInterface.php
├── Migrations/
│   └── 2026_11_10_000001_create_clarifications_table.php
├── Models/
│   └── ClarificationModel.php
├── Repositories/
│   └── ClarificationRepository.php
├── RepositoryInterfaces/
│   └── ClarificationRepositoryInterface.php
├── Rules/
│   └── ClarificationRule.php
└── Services/
    └── ClarificationService.php

    Files
Layer	Path
Migration	app/Modules/Clarification/Migrations/*_create_clarifications_table.php
Model	app/Modules/Clarification/Models/ClarificationModel.php
Request DTO	app/Modules/Clarification/DTOs/ClarificationRequestData.php
Response DTO	app/Modules/Clarification/DTOs/ClarificationResponseData.php
Envelope DTO	app/Modules/Clarification/DTOs/ClarificationActionResponseData.php
Repository Iface	app/Modules/Clarification/RepositoryInterfaces/ClarificationRepositoryInterface.php
Repository	app/Modules/Clarification/Repositories/ClarificationRepository.php
Service Iface	app/Modules/Clarification/Interfaces/ClarificationServiceInterface.php
Service	app/Modules/Clarification/Services/ClarificationService.php
Validation	app/Modules/Clarification/Rules/ClarificationRule.php
Controller	app/Modules/Clarification/Controllers/ClarificationController.php
Routes	routes/application.php (admin group)
Provider Bindings	app/Providers/AppServiceProvider.php
Fields — clarifications
Column	Type	Notes
id	UUID (PK)	auto
application_id	UUID	FK → applications.id, cascades on delete
reviewer_id	UUID	staff user raising the request
reviewer_name	string	snapshot
assigned_by	UUID	admin user id
assigned_by_name	string nullable	snapshot
subject	string	short title for the request
message	text	full narrative
items	JSON nullable	array of required items (strings)
response	text nullable	applicant's consolidated response
responded_at	timestamp nullable	auto on respond
status	enum	see lifecycle below
requested_at	timestamp	auto on create — the "date (automatically picked)"
created_at	timestamp	auto
updated_at	timestamp	auto
Status lifecycle:

Status	Description
Open	Sent to applicant, awaiting response
Responded	Applicant replied — awaiting reviewer decision
Accepted	Reviewer accepted the response; issue resolved
Rejected	Reviewer rejected the response; issue still open
Closed	Manually closed without further action
Model helpers on ClarificationModel:

php
$clarification->isOpen();
$clarification->isResponded();
$clarification->isAccepted();
$clarification->isRejected();
$clarification->isClosed();
Endpoints
All routes require the admin JWT (Authorization: Bearer <token>).

Method	URI	Description
GET	/api/v1/auth/admin/applications/{applicationId}/clarifications	List clarifications on an application
POST	/api/v1/auth/admin/applications/clarifications/raise	Raise a clarification request
POST	/api/v1/auth/admin/applications/clarifications/{id}/respond	Record applicant's response
POST	/api/v1/auth/admin/applications/clarifications/{id}/close	Accept / reject / close
Raise — POST /api/v1/auth/admin/applications/clarifications/raise
json
{
  "applicationId": "01a1c472-c67d-7048-a8b7-6695a57213ec",
  "reviewerId":    "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
  "reviewerName":  "Jane Doe",
  "assignedByName":"Admin User",
  "subject":       "Missing PDPO validity",
  "message":       "Please provide the exact validity date for your PDPO registration.",
  "items": [
    "PDPO validity date",
    "Signed officer approval"
  ]
}
Auto side-effects:

requested_at is set server-side to now() — never trusted from the
client.

If an Open clarification already exists for the application, the
request is rejected (400).

applications.status flips from Submitted / Under review →
Clarification needed.

Respond — POST …/clarifications/{id}/respond
json
{
  "response": "See attached PDPO certificate dated 2026-11-01.",
  "status":   "Responded"
}
Auto side-effects:

responded_at is set server-side to now().

applications.status flips from Clarification needed → Under review.

Close — POST …/clarifications/{id}/close
json
{ "status": "Accepted" }
Testing
json
{
  "testing": {
    "list": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/01a1c472-c67d-7048-a8b7-6695a57213ec/clarifications",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "raise": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/clarifications/raise",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "applicationId": "01a1c472-c67d-7048-a8b7-6695a57213ec",
        "reviewerId": "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
        "reviewerName": "Jane Doe",
        "subject": "Missing PDPO validity",
        "message": "Please provide the exact validity date for your PDPO registration.",
        "items": ["PDPO validity date", "Signed officer approval"]
      }
    },
    "respond": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/clarifications/8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b/respond",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "response": "See attached PDPO certificate dated 2026-11-01.",
        "status": "Responded"
      }
    },
    "close": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/clarifications/8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b/close",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": { "status": "Accepted" }
    }
  },
  "sample_responses": {
    "raise_success": {
      "status": "success",
      "message": "Clarification request sent to Acme Ltd.",
      "data": {
        "clarification": {
          "id": "8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b",
          "application_id": "01a1c472-c67d-7048-a8b7-6695a57213ec",
          "reviewer_id": "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
          "reviewer_name": "Jane Doe",
          "assigned_by": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "assigned_by_name": "Admin User",
          "subject": "Missing PDPO validity",
          "message": "Please provide the exact validity date for your PDPO registration.",
          "items": ["PDPO validity date", "Signed officer approval"],
          "response": null,
          "responded_at": null,
          "status": "Open",
          "requested_at": "2026-11-10T10:05:00+00:00",
          "created_at": "2026-11-10T10:05:00+00:00",
          "updated_at": "2026-11-10T10:05:00+00:00"
        }
      },
      "errors": []
    },
    "duplicate_open": {
      "status": "error",
      "message": "An open clarification request already exists for this application.",
      "data": { "clarification": null },
      "errors": []
    },
    "respond_success": {
      "status": "success",
      "message": "Clarification response recorded.",
      "data": {
        "clarification": {
          "id": "8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b",
          "status": "Responded",
          "response": "See attached PDPO certificate dated 2026-11-01.",
          "responded_at": "2026-11-10T11:30:00+00:00"
        }
      },
      "errors": []
    },
    "not_found": {
      "status": "error",
      "message": "Clarification not found.",
      "data": { "clarification": null },
      "errors": []
    }
  }
}

