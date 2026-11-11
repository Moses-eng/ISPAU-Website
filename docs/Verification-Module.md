
---

## 3 — `app/Modules/Verification/README.md`

```markdown
# Verification Module (Membership)

Admin-managed module for **recording verification checklists** against a
membership application. Each verification captures three fixed checks —
organisation registration, representative authority, applicable regulatory
evidence — with a result and a free-text note per check. Verifications
are immutable; re-recording supersedes the previous one, preserving a
full audit trail.

Built on the same layered-modular-monolith pattern used by
**Application**, **Reviewer**, **Clarification**.

`Verification` is a **satellite** of `Application`:

- **No auth flow of its own** — uses the existing `admins` guard.
- **Foreign keys** — `application_id` cascades on delete.
- **Snapshot fields** — `reviewer_name` and `assigned_by_name`.
- **Immutable trail** — recording a new verification flips the previous
  `Recorded` row to `Superseded`.
- **Auto status transition** — if any check is `Clarification needed`,
  the application flips to `Clarification needed`.
- **Fixed schema** — the three checks are dedicated columns, not JSON,
  because the frontend dialog (`workspace-dialog`) renders them as a
  fixed fieldset layout (`result-0`, `note-0`, …).

---

## Architecture

```bash
app/Modules/Verification/
├── Controllers/
│   └── VerificationController.php
├── DTOs/
│   ├── VerificationRequestData.php
│   ├── VerificationResponseData.php
│   └── VerificationActionResponseData.php
├── Interfaces/
│   └── VerificationServiceInterface.php
├── Migrations/
│   └── 2026_11_10_000002_create_verifications_table.php
├── Models/
│   └── VerificationModel.php
├── Repositories/
│   └── VerificationRepository.php
├── RepositoryInterfaces/
│   └── VerificationRepositoryInterface.php
├── Rules/
│   └── VerificationRule.php
└── Services/
    └── VerificationService.php

    Files
Layer	Path
Migration	app/Modules/Verification/Migrations/*_create_verifications_table.php
Model	app/Modules/Verification/Models/VerificationModel.php
Request DTO	app/Modules/Verification/DTOs/VerificationRequestData.php
Response DTO	app/Modules/Verification/DTOs/VerificationResponseData.php
Envelope DTO	app/Modules/Verification/DTOs/VerificationActionResponseData.php
Repository Iface	app/Modules/Verification/RepositoryInterfaces/VerificationRepositoryInterface.php
Repository	app/Modules/Verification/Repositories/VerificationRepository.php
Service Iface	app/Modules/Verification/Interfaces/VerificationServiceInterface.php
Service	app/Modules/Verification/Services/VerificationService.php
Validation	app/Modules/Verification/Rules/VerificationRule.php
Controller	app/Modules/Verification/Controllers/VerificationController.php
Routes	routes/application.php (admin group)
Provider Bindings	app/Providers/AppServiceProvider.php
Fields — verifications
Column	Type	Notes
id	UUID (PK)	auto
application_id	UUID	FK → applications.id, cascades on delete
reviewer_id	UUID	staff user recording the verification
reviewer_name	string	snapshot
assigned_by	UUID	admin user id
assigned_by_name	string nullable	snapshot
registration_result	string	Verified | Clarification needed | Not applicable
registration_note	text	required explanation
authority_result	string	same enum
authority_note	text	required explanation
regulatory_result	string	same enum
regulatory_note	text	required explanation
status	enum	Recorded | Superseded
recorded_at	timestamp	auto on create — the "date (automatically picked)"
created_at	timestamp	auto
updated_at	timestamp	auto
Status lifecycle:

Status	Description
Recorded	The current, active verification for the application
Superseded	A later verification replaced this one
Model helpers on VerificationModel:

php
$verification->isRecorded();
$verification->isSuperseded();
Field mapping — workspace-dialog → backend
The dialog rendered by the admin UI submits exactly these names:

HTML field	Backend column
result-0	registration_result
note-0	registration_note
result-1	authority_result
note-1	authority_note
result-2	regulatory_result
note-2	regulatory_note
The VerificationRequestData::fromRequest() method reads these names
directly, and VerificationRule::recordRules() validates them verbatim —
so the same FormData collected from the <dialog> posts straight to the
endpoint, no re-shaping required.

Endpoints
All routes require the admin JWT (Authorization: Bearer <token>).

Method	URI	Description
GET	/api/v1/auth/admin/applications/{applicationId}/verifications	List verifications on an application
POST	/api/v1/auth/admin/applications/verifications/record	Record a new verification
Record — POST /api/v1/auth/admin/applications/verifications/record
json
{
  "applicationId": "01a1c472-c67d-7048-a8b7-6695a57213ec",
  "reviewerId":    "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
  "reviewerName":  "Jane Doe",
  "assignedByName":"Admin User",
  "result-0": "Clarification needed",
  "note-0":   "Registration certificate appears expired",
  "result-1": "Verified",
  "note-1":   "Signed authority letter dated 2026-11-01",
  "result-2": "Verified",
  "note-2":   "Valid UCC licence no. UCC/2026/00123"
}
Auto side-effects:

recorded_at is set server-side to now() — never trusted from
the client.

Any previous Recorded verification for the application is flipped to
Superseded.

If any of the three results is Clarification needed,
applications.status flips from Submitted / Under review →
Clarification needed.

Testing
json
{
  "testing": {
    "list": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/01a1c472-c67d-7048-a8b7-6695a57213ec/verifications",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "record": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/verifications/record",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "applicationId": "01a1c472-c67d-7048-a8b7-6695a57213ec",
        "reviewerId": "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
        "reviewerName": "Jane Doe",
        "result-0": "Clarification needed",
        "note-0": "Registration certificate appears expired",
        "result-1": "Verified",
        "note-1": "Signed authority letter dated 2026-11-01",
        "result-2": "Verified",
        "note-2": "Valid UCC licence no. UCC/2026/00123"
      }
    }
  },
  "sample_responses": {
    "record_success": {
      "status": "success",
      "message": "Record verification saved.",
      "data": {
        "verification": {
          "id": "8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b",
          "application_id": "01a1c472-c67d-7048-a8b7-6695a57213ec",
          "reviewer_id": "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
          "reviewer_name": "Jane Doe",
          "assigned_by": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "assigned_by_name": "Admin User",
          "checks": {
            "registration": {
              "label": "Organisation registration",
              "result": "Clarification needed",
              "note": "Registration certificate appears expired"
            },
            "authority": {
              "label": "Representative authority",
              "result": "Verified",
              "note": "Signed authority letter dated 2026-11-01"
            },
            "regulatory": {
              "label": "Applicable regulatory evidence",
              "result": "Verified",
              "note": "Valid UCC licence no. UCC/2026/00123"
            }
          },
          "status": "Recorded",
          "recorded_at": "2026-11-10T11:45:00+00:00",
          "created_at": "2026-11-10T11:45:00+00:00",
          "updated_at": "2026-11-10T11:45:00+00:00"
        }
      },
      "errors": []
    },
    "validation_failed": {
      "status": "error",
      "message": "The given data was invalid.",
      "data": { "verification": null },
      "errors": {
        "result-0": ["The selected result-0 is invalid."],
        "note-1":   ["The note-1 field is required."]
      }
    },
    "not_found": {
      "status": "error",
      "message": "Application not found.",
      "data": { "verification": null },
      "errors": []
    }
  }
}
