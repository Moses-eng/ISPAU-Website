# Application Module (Membership)

Admin-managed CRUD + public submission module for **membership applications**
— the multi-step form an organisation completes to apply for ISPAU membership.
Captures organisation identity, compliance, applicant, billing, optional public
profile, declarations, and file uploads (PDF/JPG/PNG up to 10 MB).

Built on the same layered-modular-monolith pattern used by **Enquiry**,
**Contact**, **FAQ**, **FAQCategory**, **ServiceName**, **Admin Users**, etc.

`Application` is a **variant** of `Enquiry` / `Contact` with three key
extensions:

- **File uploads** stored under `public/application/{uuid}/...` and referenced
  from the `attachments` JSON column.
- **JSON columns** for repeating / optional blocks (organisation details,
  compliance, applicant extras, billing extras, optional public profile,
  restrictions, declarations).
- **Draft → submitted → under_review → approved → rejected → archived** status
  lifecycle (public submits, admins transition).

- **No JWT guard of its own** — admin routes use the existing `admins` guard.
- **No auth flow** — the public `store` endpoint is open so applicants can
  submit without a token.

---

## Architecture

```bash
app/Modules/Application/
├── Controllers/
│   └── ApplicationController.php
├── DTOs/
│   ├── ApplicationResponseData.php
│   ├── ApplicationActionResponseData.php
│   └── ApplicationRequestData.php
├── Interfaces/
│   └── ApplicationServiceInterface.php
├── Migrations/
│   └── 2026_10_04_000000_create_applications_table.php
├── Models/
│   └── ApplicationModel.php
├── Repositories/
│   └── ApplicationRepository.php
├── RepositoryInterfaces/
│   └── ApplicationRepositoryInterface.php
├── Rules/
│   └── ApplicationRule.php
└── Services/
    ├── ApplicationService.php
    └── ApplicationAttachmentService.php
```

---

## Files

| Layer             | Path                                                                              |
|-------------------|-----------------------------------------------------------------------------------|
| Migration         | `app/Modules/Application/Migrations/*_create_applications_table.php`              |
| Model             | `app/Modules/Application/Models/ApplicationModel.php`                             |
| Request DTO       | `app/Modules/Application/DTOs/ApplicationRequestData.php`                         |
| Response DTO      | `app/Modules/Application/DTOs/ApplicationResponseData.php`                        |
| Envelope DTO      | `app/Modules/Application/DTOs/ApplicationActionResponseData.php`                  |
| Repository Iface  | `app/Modules/Application/RepositoryInterfaces/ApplicationRepositoryInterface.php` |
| Repository        | `app/Modules/Application/Repositories/ApplicationRepository.php`                  |
| Service Iface     | `app/Modules/Application/Interfaces/ApplicationServiceInterface.php`              |
| Service           | `app/Modules/Application/Services/ApplicationService.php`                         |
| Uploads           | `app/Modules/Application/Services/ApplicationAttachmentService.php`               |
| Validation        | `app/Modules/Application/Rules/ApplicationRule.php`                               |
| Controller        | `app/Modules/Application/Controllers/ApplicationController.php`                   |
| Routes            | `routes/application.php`                                                          |
| Provider Bindings | `app/Providers/AppServiceProvider.php`                                            |

---

## Fields — `applications`

### Scalar columns (indexed / searchable)

| Column                   | Type                          | Notes                              |
|--------------------------|-------------------------------|------------------------------------|
| `id`                     | UUID (PK)                     | auto                               |
| `legal_name`             | string                        | required                           |
| `trading_name`           | string nullable               | optional                           |
| `entity_type`            | string                        | required                           |
| `registration_country`   | string                        | required                           |
| `registration_reference` | string                        | required                           |
| `business_email`         | string                        | required, indexed                  |
| `business_phone`         | string(30)                    | required                           |
| `website`                | string nullable               | optional                           |
| `registered_address`     | text                          | required                           |
| `uganda_address`         | text                          | required                           |
| `category`               | string                        | required, indexed                  |
| `operational_status`     | string                        | required                           |
| `requested_tier`         | string                        | required, indexed                  |
| `customer_facing`        | string (Yes/No)               | required                           |
| `pdpo_status`            | string                        | required                           |
| `licence_relevant`       | string                        | required                           |
| `applicant_*`            | string fields                 | name, role, email, phone           |
| `representative_*`       | string fields                 | name, role, email, phone           |
| `billing_*`              | string fields                 | email, contact, invoice address    |
| `status`                 | enum                          | see lifecycle below                |
| `created_at` / `updated_at` | timestamps                 | auto                               |

### JSON columns

| Column                 | Contents                                                              |
|------------------------|-----------------------------------------------------------------------|
| `organisation_details` | `services`, `regions`, `parent_group`                                 |
| `compliance_details`   | `pdpo_*`, `licence_*` (entry 1 and entry 2)                           |
| `applicant_details`    | `alternate_representative`, `same_representative`, `authority_confirmed` |
| `billing_details`      | `tin`, `purchase_order`, `support_contact`                            |
| `profile_optional`     | `joining_reasons`, `priorities`, `working_groups`, all `public_*`     |
| `restrictions`         | `has_restrictions`, `restriction_details`                             |
| `declarations`         | `accuracy`, `authority`, `rules`, `restrictions`, `privacy`, `directory`, `promotional` |
| `attachments`          | `{ registrationEvidence: "application/{id}/registrationEvidence.pdf", ... }` |

**Status lifecycle:**

| Status         | Description                                         |
|----------------|-----------------------------------------------------|
| `draft`        | Saved but not submitted                             |
| `submitted`    | Applicant submitted — default on creation           |
| `under_review` | Membership team reviewing                           |
| `approved`     | Accepted                                            |
| `rejected`     | Declined                                            |
| `archived`     | Retired / hidden                                    |

Model helpers on `ApplicationModel`:

```bash
$app->isDraft(); $app->isSubmitted(); $app->isUnderReview();
$app->isApproved(); $app->isRejected(); $app->isArchived();
```

---

## File uploads

- **Accepted types:** `pdf`, `jpg`, `jpeg`, `png`
- **Max size:** 10 MB per file
- **Disk:** Laravel `public` disk (run `php artisan storage:link` once)
- **Path pattern:** `storage/app/public/application/{applicationId}/{uploadKey}.{ext}`
- **Public URL:** `/storage/application/{applicationId}/{uploadKey}.{ext}`
- **Upload keys:** `registrationEvidence`, `licenceEvidence`,
  `authorityEvidence`, `pdpoEvidence` (all optional except where the form
  requires them — the frontend validates; the backend accepts what is sent).
- **Deletion:** the service deletes `application/{applicationId}/` recursively
  when the application is deleted.

If you need the files literally under `public/application`, set the disk to
`local` and use `public_path('application')` in
`ApplicationAttachmentService::storeAll()` — the rest of the code is
disk-agnostic.

---

## Endpoints

```bash
All admin routes require the admin JWT (Authorization: Bearer <token>
issued by the admins guard). The store endpoint is public.
```

| Method | URI                                          | Description                |
|--------|----------------------------------------------|----------------------------|
| GET    | `/api/v1/auth/admin/applications/list`       | List all applications      |
| GET    | `/api/v1/auth/admin/applications/show/{id}`  | Show a single application  |
| POST   | `/api/v1/public/applications/store`          | Submit new application     |
| POST   | `/api/v1/auth/admin/applications/update`     | Update an application      |
| DELETE | `/api/v1/auth/admin/applications/delete`     | Delete an application      |

The **store** endpoint must be sent as **`multipart/form-data`** when uploads
are included:

```bash
curl -X POST http://localhost:8000/api/v1/public/applications/store \
  -F "legalName=Acme Ltd" \
  -F "entityType=Private company limited by shares" \
  -F "registrationCountry=Uganda" \
  -F "registrationReference=800100000000" \
  -F "businessEmail=info@acme.co.ug" \
  -F "businessPhone=+256771234567" \
  -F "registeredAddress=Kampala" \
  -F "ugandaAddress=Kampala" \
  -F "category=Internet service provider" \
  -F "operationalStatus=Operational" \
  -F "requestedTier=Silver — USD 500" \
  -F "customerFacing=Yes" \
  -F "pdpoStatus=Registered" \
  -F "licenceRelevant=Yes" \
  -F "applicantName=Amina Nakato" \
  -F "applicantRole=Director" \
  -F "applicantEmail=amina@acme.co.ug" \
  -F "applicantPhone=+256771234567" \
  -F "representativeName=Amina Nakato" \
  -F "representativeRole=Director" \
  -F "representativeEmail=amina@acme.co.ug" \
  -F "representativePhone=+256771234567" \
  -F "billingEmail=billing@acme.co.ug" \
  -F "billingContact=Finance" \
  -F "invoiceAddress=Kampala" \
  -F "accuracyDeclaration=1" \
  -F "authorityDeclaration=1" \
  -F "rulesDeclaration=1" \
  -F "restrictionsDeclaration=1" \
  -F "privacyDeclaration=1" \
  -F "uploads[registrationEvidence]=@/tmp/cert.pdf" \
  -F "uploads[authorityEvidence]=@/tmp/auth.pdf"
```

### Query filters (list)

- `search` — matches `legal_name`, `trading_name`, `business_email`, `business_phone`, `applicant_email`
- `status` — `draft | submitted | under_review | approved | rejected | archived`
- `requested_tier` — exact match
- `category` — exact match
- `sort` — column name (default `created_at`)
- `order` — `asc | desc` (default `desc`)

---

## Testing

```json
{
  "testing": {
    "list": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/list",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "list_with_filters": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/list?search=acme&status=submitted&requested_tier=Silver%20%E2%80%94%20USD%20500",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "show": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/show/01a0fc04-83f2-709f-b6bf-f2905e883bae",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "store": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/public/applications/store",
      "headers": {
        "Content-Type": "multipart/form-data",
        "Accept": "application/json"
      },
      "body": {
        "legalName": "Acme Ltd",
        "entityType": "Private company limited by shares",
        "registrationCountry": "Uganda",
        "registrationReference": "800100000000",
        "businessEmail": "info@acme.co.ug",
        "businessPhone": "+256771234567",
        "registeredAddress": "Kampala",
        "ugandaAddress": "Kampala",
        "category": "Internet service provider",
        "operationalStatus": "Operational",
        "requestedTier": "Silver — USD 500",
        "customerFacing": "Yes",
        "pdpoStatus": "Registered",
        "licenceRelevant": "Yes",
        "applicantName": "Amina Nakato",
        "applicantRole": "Director",
        "applicantEmail": "amina@acme.co.ug",
        "applicantPhone": "+256771234567",
        "representativeName": "Amina Nakato",
        "representativeRole": "Director",
        "representativeEmail": "amina@acme.co.ug",
        "representativePhone": "+256771234567",
        "billingEmail": "billing@acme.co.ug",
        "billingContact": "Finance",
        "invoiceAddress": "Kampala",
        "accuracyDeclaration": true,
        "authorityDeclaration": true,
        "rulesDeclaration": true,
        "restrictionsDeclaration": true,
        "privacyDeclaration": true,
        "uploads": {
          "registrationEvidence": "<file>",
          "authorityEvidence": "<file>"
        }
      }
    },
    "update": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/update",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "updateId": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
        "status": "under_review"
      }
    },
    "delete": {
      "method": "DELETE",
      "url": "http://localhost:8000/api/v1/auth/admin/applications/delete",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "deleteId": "01a0fc04-83f2-709f-b6bf-f2905e883bae"
      }
    }
  },
  "sample_responses": {
    "list_success": {
      "status": "success",
      "message": "Applications fetched successfully.",
      "data": {
        "application": null,
        "items": [
          {
            "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
            "status": "submitted",
            "legal_name": "Acme Ltd",
            "business_email": "info@acme.co.ug",
            "requested_tier": "Silver — USD 500",
            "created_at": "2026-10-05T09:49:09+00:00",
            "updated_at": "2026-10-05T09:49:09+00:00"
          }
        ],
        "total": 1
      },
      "errors": []
    },
    "store_success": {
      "status": "success",
      "message": "Application for Acme Ltd submitted successfully.",
      "data": {
        "application": {
          "id": "9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c",
          "status": "submitted",
          "legal_name": "Acme Ltd",
          "attachments": {
            "registrationEvidence": "application/9b1c3e7a-.../registrationEvidence.pdf",
            "authorityEvidence": "application/9b1c3e7a-.../authorityEvidence.pdf"
          },
          "created_at": "2026-10-05T10:05:08+00:00",
          "updated_at": "2026-10-05T10:05:08+00:00"
        }
      },
      "errors": []
    },
    "not_found": {
      "status": "error",
      "message": "Application not found.",
      "data": { "application": null },
      "errors": []
    }
  }
}
```
