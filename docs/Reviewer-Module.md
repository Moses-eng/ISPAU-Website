# Reviewer Module (Membership)

Admin-managed module for **assigning staff reviewers** to a membership
application. A reviewer is a staff member responsible for moving an
application through the review pipeline. Assignment is additive: an
application can have multiple reviewers over its lifetime, with only one
"active" per staff member at any time.

Built on the same layered-modular-monolith pattern used by
**Application**, **Enquiry**, **Contact**, **FAQ**, etc.

`Reviewer` is a **satellite** of `Application`:

- **No auth flow of its own** — uses the existing `admins` guard.
- **Foreign keys** — `application_id` cascades on delete.
- **Snapshot fields** — `reviewer_name` and `assigned_by_name` are
  denormalised so the assignment survives staff-user renames.
- **Auto status transition** — assigning the first reviewer moves a
  `Submitted` application to `Under review`.

---

## Architecture

```bash
app/Modules/Reviewer/
├── Controllers/
│   └── ReviewerController.php
├── DTOs/
│   ├── ReviewerRequestData.php
│   ├── ReviewerResponseData.php
│   └── ReviewerActionResponseData.php
├── Interfaces/
│   └── ReviewerServiceInterface.php
├── Migrations/
│   └── 2026_11_10_000000_create_reviewers_table.php
├── Models/
│   └── ReviewerModel.php
├── Repositories/
│   └── ReviewerRepository.php
├── RepositoryInterfaces/
│   └── ReviewerRepositoryInterface.php
├── Rules/
│   └── ReviewerRule.php
└── Services/
    └── ReviewerService.php


Files
Layer	Path
Migration	app/Modules/Reviewer/Migrations/*_create_reviewers_table.php
Model	app/Modules/Reviewer/Models/ReviewerModel.php
Request DTO	app/Modules/Reviewer/DTOs/ReviewerRequestData.php
Response DTO	app/Modules/Reviewer/DTOs/ReviewerResponseData.php
Envelope DTO	app/Modules/Reviewer/DTOs/ReviewerActionResponseData.php
Repository Iface	app/Modules/Reviewer/RepositoryInterfaces/ReviewerRepositoryInterface.php
Repository	app/Modules/Reviewer/Repositories/ReviewerRepository.php
Service Iface	app/Modules/Reviewer/Interfaces/ReviewerServiceInterface.php
Service	app/Modules/Reviewer/Services/ReviewerService.php
Validation	app/Modules/Reviewer/Rules/ReviewerRule.php
Controller	app/Modules/Reviewer/Controllers/ReviewerController.php
Routes	routes/application.php (admin group)
Provider Bindings	app/Providers/AppServiceProvider.php
Fields — reviewers
Column	Type	Notes
id	UUID (PK)	auto
application_id	UUID	FK → applications.id, cascades on delete
reviewer_id	UUID	staff user id
reviewer_name	string	snapshot at time of assignment
assigned_by	UUID	admin user id performing the assignment
assigned_by_name	string nullable	snapshot of the assigner's display name
status	enum	Assigned, In review, Completed, Withdrawn
assigned_at	timestamp	auto on create
completed_at	timestamp nullable	set when status → Completed or Withdrawn
created_at	timestamp	auto
updated_at	timestamp	auto
Unique constraint: (application_id, reviewer_id) — prevents duplicate
active assignments.

Model helpers on ReviewerModel:

php
$reviewer->isAssigned();
$reviewer->isInReview();
$reviewer->isCompleted();
$reviewer->isWithdrawn();
Status lifecycle:

Status	Description
Assigned	Created; reviewer has been notified but hasn't started
In review	Reviewer is actively reviewing
Completed	Reviewer finished and submitted a decision
Withdrawn	Assignment withdrawn by an admin
Endpoints
All routes require the admin JWT (Authorization: Bearer <token> issued
by the admins guard).

Method	URI	Description
GET	/api/v1/auth/admin/applications/{applicationId}/reviewers	List reviewers on an application
POST	/api/v1/auth/admin/applications/reviewers/assign	Assign a reviewer
DELETE	/api/v1/auth/admin/applications/reviewers/{id}	Withdraw an assignment
Assign — POST /api/v1/auth/admin/applications/reviewers/assign
json
{
  "applicationId":  "01a1c472-c67d-7048-a8b7-6695a57213ec",
  "reviewerId":     "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
  "reviewerName":   "Jane Doe",
  "assignedByName": "Admin User"
}
Auto side-effects:

applications.status flips from Submitted → Under review.

409/400 if the same reviewer is already Assigned or In review on
that application.

Testing
json
{
  "testing": {
    "list": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/01a1c472-c67d-7048-a8b7-6695a57213ec/reviewers",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "assign": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/reviewers/assign",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "applicationId": "01a1c472-c67d-7048-a8b7-6695a57213ec",
        "reviewerId": "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
        "reviewerName": "Jane Doe",
        "assignedByName": "Admin User"
      }
    },
    "withdraw": {
      "method": "DELETE",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/reviewers/8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    }
  },
  "sample_responses": {
    "assign_success": {
      "status": "success",
      "message": "Reviewer Jane Doe assigned successfully.",
      "data": {
        "reviewer": {
          "id": "8f1a2b3c-4d5e-6f70-8a9b-0c1d2e3f4a5b",
          "application_id": "01a1c472-c67d-7048-a8b7-6695a57213ec",
          "reviewer_id": "6d1c2bd1-8e5a-4f1c-9b6e-2a7c8d1e3f45",
          "reviewer_name": "Jane Doe",
          "assigned_by": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "assigned_by_name": "Admin User",
          "status": "Assigned",
          "assigned_at": "2026-11-10T10:00:00+00:00",
          "completed_at": null,
          "created_at": "2026-11-10T10:00:00+00:00",
          "updated_at": "2026-11-10T10:00:00+00:00"
        }
      },
      "errors": []
    },
    "duplicate": {
      "status": "error",
      "message": "This reviewer is already assigned to this application.",
      "data": { "reviewer": null },
      "errors": []
    },
    "not_found": {
      "status": "error",
      "message": "Reviewer assignment not found.",
      "data": { "reviewer": null },
      "errors": []
    }
  }
}
