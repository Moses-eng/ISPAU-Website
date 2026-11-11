# Contact Module

Admin-managed CRUD module for **contacts** — the structured contact
submissions made by visitors and prospective customers on the GWT platform
(e.g. "I'd like to discuss a partnership", "Request a demo", "General
question about your services").

Built on the same layered-modular-monolith pattern used by **FAQ**,
**FAQCategory**, **ServiceOption**, **SubService**, **ServiceName**,
**ServiceGroup**, **Admin Users**, the **Enterprise * User** family, and
**Enquiry**.

`Contact` is a **direct twin** of `Enquiry`:

- **Same routes**, **same controller methods**, **same DTO envelope**, **same
  service provider wiring** — the only differences are the table
  (`contacts`), the route prefix (`/contacts`), the DTO field (`contact`),
  and the contact-specific columns (`work_email`, `organisation`,
  `enquiry_type`).
- **No JWT guard of its own** — all admin routes are protected by the
  existing `admins` guard from the AdminUser module.
- **No auth flow**, **no file uploads** — just plain text CRUD.
- The **store** endpoint is public (no auth) so the website can submit
  contact forms without a token.

---

## Architecture

```bash
app/Modules/Contact/
├── Controllers/
│   └── ContactController.php
├── DTOs/
│   ├── ContactResponseData.php
│   ├── ContactActionResponseData.php
│   └── ContactRequestData.php
├── Interfaces/
│   └── ContactServiceInterface.php
├── Migrations/
│   └── 2026_10_04_000000_create_contacts_table.php
├── Models/
│   └── ContactModel.php
├── Repositories/
│   └── ContactRepository.php
├── RepositoryInterfaces/
│   └── ContactRepositoryInterface.php
├── Rules/
│   └── ContactRule.php
└── Services/
    └── ContactService.php
```

---

## Files

| Layer             | Path                                                                          |
|-------------------|-------------------------------------------------------------------------------|
| Migration         | `app/Modules/Contact/Migrations/*_create_contacts_table.php`                  |
| Model             | `app/Modules/Contact/Models/ContactModel.php`                                 |
| Request DTO       | `app/Modules/Contact/DTOs/ContactRequestData.php`                             |
| Response DTO      | `app/Modules/Contact/DTOs/ContactResponseData.php`                            |
| Envelope DTO      | `app/Modules/Contact/DTOs/ContactActionResponseData.php`                      |
| Repository Iface  | `app/Modules/Contact/RepositoryInterfaces/ContactRepositoryInterface.php`     |
| Repository        | `app/Modules/Contact/Repositories/ContactRepository.php`                      |
| Service Iface     | `app/Modules/Contact/Interfaces/ContactServiceInterface.php`                  |
| Service           | `app/Modules/Contact/Services/ContactService.php`                             |
| Validation        | `app/Modules/Contact/Rules/ContactRule.php`                                   |
| Controller        | `app/Modules/Contact/Controllers/ContactController.php`                       |
| Routes            | `routes/contact.php`                                                          |
| Provider Bindings | `app/Providers/AppServiceProvider.php`                                        |

---

## Fields — `contacts`

| Column         | Type                                   | Notes                                    |
|----------------|----------------------------------------|------------------------------------------|
| `id`           | UUID (PK)                              | auto-generated                           |
| `name`         | string                                 | required — the enquirer's full name      |
| `work_email`   | string                                 | required — business email                |
| `organisation` | string                                 | required — company / organisation name   |
| `message`      | text                                   | required — free-form message             |
| `enquiry_type` | string                                 | required — free-form type (e.g. "demo")  |
| `status`       | enum(active/inactive/archived)         | default `active`                         |
| `created_at`   | timestamp                              | auto                                     |
| `updated_at`   | timestamp                              | auto                                     |

**Status values:**

| Status     | Description                                                |
|------------|------------------------------------------------------------|
| `active`   | Open / new — actionable (default)                           |
| `inactive` | Handled / closed                                            |
| `archived` | Retired — kept for historical / reporting purposes          |

Model helpers on `ContactModel`:

```bash
$contact->isActive();   // status === 'active'
$contact->isInactive(); // status === 'inactive'
$contact->isArchived(); // status === 'archived'
```

---

## Endpoints

```bash
All admin routes require the admin JWT (Authorization: Bearer <token>
issued by the admins guard). The store endpoint is public.
```

| Method | URI                                       | Description               |
|--------|-------------------------------------------|---------------------------|
| GET    | `/api/v1/auth/admin/contacts/list`        | List all contacts         |
| GET    | `/api/v1/auth/admin/contacts/show/{id}`   | Show a single contact     |
| POST   | `/api/v1/public/contacts/store`           | Create a new contact      |
| POST   | `/api/v1/auth/admin/contacts/update`      | Update an existing contact|
| DELETE | `/api/v1/auth/admin/contacts/delete`      | Delete a contact          |

### Query filters (list)

- `search` — matches `name`, `work_email`, `organisation`, `message`, `enquiry_type`
- `status` — `active` | `inactive` | `archived`
- `enquiry_type` — partial match on `enquiry_type`
- `organisation` — partial match on `organisation`
- `sort` — column name (default `created_at`)
- `order` — `asc` | `desc` (default `desc`)

---

## Testing

```json
{
  "testing": {
    "list": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/contacts/list",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "list_with_filters": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/contacts/list?search=demo&status=active&enquiry_type=partnership",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "show": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/contacts/show/01a0fc04-83f2-709f-b6bf-f2905e883bae",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "store": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/public/contacts/store",
      "headers": {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "name": "Amina Nakato",
        "work_email": "amina@example.com",
        "organisation": "Nakato Solar Ltd",
        "message": "I'd like to discuss a partnership for solar installations in Kampala.",
        "enquiry_type": "partnership",
        "status": "active"
      }
    },
    "update": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/contacts/update",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "updateId": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
        "message": "Followed up — partnership deck sent on 2026-10-05.",
        "status": "inactive"
      }
    },
    "delete": {
      "method": "DELETE",
      "url": "http://localhost:8000/api/v1/auth/admin/contacts/delete",
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
      "message": "Contacts fetched successfully.",
      "data": {
        "contact": null,
        "items": [
          {
            "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
            "name": "Amina Nakato",
            "work_email": "amina@example.com",
            "organisation": "Nakato Solar Ltd",
            "message": "I'd like to discuss a partnership for solar installations in Kampala.",
            "enquiry_type": "partnership",
            "status": "active",
            "created_at": "2026-10-05T09:49:09+00:00",
            "updated_at": "2026-10-05T09:49:09+00:00"
          }
        ],
        "total": 1
      },
      "errors": []
    },
    "show_success": {
      "status": "success",
      "message": "Contact fetched successfully.",
      "data": {
        "contact": {
          "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "name": "Amina Nakato",
          "work_email": "amina@example.com",
          "organisation": "Nakato Solar Ltd",
          "message": "I'd like to discuss a partnership for solar installations in Kampala.",
          "enquiry_type": "partnership",
          "status": "active",
          "created_at": "2026-10-05T09:49:09+00:00",
          "updated_at": "2026-10-05T09:49:09+00:00"
        }
      },
      "errors": []
    },
    "store_success": {
      "status": "success",
      "message": "Contact from Amina Nakato created successfully.",
      "data": {
        "contact": {
          "id": "9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c",
          "name": "Amina Nakato",
          "work_email": "amina@example.com",
          "organisation": "Nakato Solar Ltd",
          "message": "I'd like to discuss a partnership for solar installations in Kampala.",
          "enquiry_type": "partnership",
          "status": "active",
          "created_at": "2026-10-05T10:05:08+00:00",
          "updated_at": "2026-10-05T10:05:08+00:00"
        }
      },
      "errors": []
    },
    "update_success": {
      "status": "success",
      "message": "Contact updated successfully.",
      "data": {
        "contact": {
          "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "name": "Amina Nakato",
          "work_email": "amina@example.com",
          "organisation": "Nakato Solar Ltd",
          "message": "Followed up — partnership deck sent on 2026-10-05.",
          "enquiry_type": "partnership",
          "status": "inactive",
          "created_at": "2026-10-05T09:49:09+00:00",
          "updated_at": "2026-10-05T10:15:30+00:00"
        }
      },
      "errors": []
    },
    "delete_success": {
      "status": "success",
      "message": "Contact deleted successfully.",
      "data": { "contact": null },
      "errors": []
    },
    "not_found": {
      "status": "error",
      "message": "Contact not found.",
      "data": { "contact": null },
      "errors": []
    }
  }
}
```
