Here is the complete, production-ready `README.md` for the **Hero Slide Module**. You can save this file directly to `app/Modules/HeroSlide/README.md`.

```markdown
# Hero Slide Module

Admin-managed CRUD module for hero slides — the rotating carousel images displayed across public-facing marketing pages (e.g., Home, Membership). 

Each slide maintains an image asset, accessibility text (alt description), a display caption, an optional photographer credit, a numeric display sort order, and a lifecycle status.

---

## Table of Contents
- [Architecture & Design](#architecture--design)
- [Directory Structure](#directory-structure)
- [Scaffolding Commands](#scaffolding-commands)
- [Database Schema](#database-schema)
- [File Storage Layout](#file-storage-layout)
- [API Endpoints](#api-endpoints)
- [Validation Rules](#validation-rules)
- [Testing & Payloads](#testing--payloads)
- [Design Decisions](#design-decisions)

---

## Architecture & Design

Built following the **Layered Modular Monolith** pattern used throughout the system (matching `Tier`, `Contact`, `Enquiry`, etc.):

- **Direct Twin of `Tier`**: Matches route conventions, controller methods, envelope DTO formats, and service provider wiring.
- **Attachment Handling**: Integrates `HeroSlideAttachmentService` (patterned after `ApplicationAttachmentService`) to manage slide image upload, cleanup, and disk deletion.
- **Authentication**:
  - Admin endpoints are protected via the existing `admins` JWT guard.
  - Public listing endpoint is open and unauthenticated for zero-latency marketing carousel rendering.
- **Transactions**: DB inserts/updates and image file writes run within atomic transactions to avoid orphan rows or orphan files on disk.

---

## Directory Structure

```text
app/Modules/HeroSlide/
├── Controllers/
│   └── HeroSlideController.php
├── DTOs/
│   ├── HeroSlideActionResponseData.php
│   ├── HeroSlideRequestData.php
│   └── HeroSlideResponseData.php
├── Interfaces/
│   └── HeroSlideServiceInterface.php
├── Migrations/
│   └── 2026_11_14_000000_create_hero_slides_table.php
├── Models/
│   └── HeroSlideModel.php
├── Providers/
│   └── HeroSlideServiceProvider.php
├── Repositories/
│   └── HeroSlideRepository.php
├── RepositoryInterfaces/
│   └── HeroSlideRepositoryInterface.php
├── Routes/
│   └── api.php
├── Rules/
│   └── HeroSlideRule.php
└── Services/
    ├── HeroSlideAttachmentService.php
    └── HeroSlideService.php
```

---


---

## Database Schema

### Table: `hero_slides`

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | — | Primary key (auto-generated) |
| `src` | `string` | No | — | Relative path: `images/heroSlide/{id}/image.{ext}` |
| `description` | `string(255)`| No | — | Accessibility alt text |
| `caption` | `string(255)`| No | — | Visible title/caption |
| `credit` | `string(255)`| Yes | `null` | Photographer or asset attribution |
| `sort_order` | `unsignedInteger` | No | `0` | Order in carousel (lower = earlier) |
| `status` | `enum` | No | `'active'` | `'active'`, `'inactive'`, `'archived'` |
| `created_at` | `timestamp` | Yes | `null` | Creation timestamp |
| `updated_at` | `timestamp` | Yes | `null` | Last update timestamp |

### Model Helper Methods (`HeroSlideModel`)

```php
$slide->isActive();   // bool: status === 'active'
$slide->isInactive(); // bool: status === 'inactive'
$slide->isArchived(); // bool: status === 'archived'
```

---

## File Storage Layout

Assets are managed using a strict one-folder-per-record pattern:

```text
public/
└── images/
    └── heroSlide/
        ├── 9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c/
        │   └── image.jpg
        ├── 01a0fc04-83f2-709f-b6bf-f2905e883bae/
        │   └── image.webp
        └── ...
```

- **Relative Paths**: Database stores only `images/heroSlide/{id}/image.{ext}`. Frontend resolves the full URL via base URL / `asset()`.
- **Extension-Safe Replacement**: When a slide image is replaced, any prior file (`image.jpg`, `image.png`, `image.webp`) is wiped before writing the new one.
- **Cascade Cleanup**: Deleting a slide deletes the entire `{id}/` directory automatically.

---

## API Endpoints

All admin endpoints require an Admin Bearer Token (`Authorization: Bearer <token>`).

| Method | URI | Auth | Content-Type | Purpose |
|---|---|---|---|---|
| `GET` | `/api/v1/public/hero-slides/list` | None | — | Public carousel items (active only, ordered) |
| `GET` | `/api/v1/auth/admin/hero-slides/list` | Admin | — | Admin list with search and filters |
| `GET` | `/api/v1/auth/admin/hero-slides/show/{id}` | Admin | — | Fetch single slide by UUID |
| `POST` | `/api/v1/auth/admin/hero-slides/store` | Admin | `multipart/form-data` | Create new slide and upload image |
| `POST` | `/api/v1/auth/admin/hero-slides/update` | Admin | `multipart/form-data` | Update slide text/order and/or replace image |
| `DELETE` | `/api/v1/auth/admin/hero-slides/delete` | Admin | `application/json` | Delete slide and its image assets |

### Query Filters (`GET /api/v1/auth/admin/hero-slides/list`)
- `search` (string): Searches `description`, `caption`, and `credit`.
- `status` (string): Filter by `active`, `inactive`, or `archived`.
- `sort` (string): Column to sort by (default: `sort_order`).
- `order` (string): `asc` or `desc` (default: `asc`).

---

## Validation Rules

### Store Rules (`HeroSlideRule::createRules()`)
```php
[
    'image'       => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // Max 5MB
    'description' => ['required', 'string', 'max:255'],
    'caption'     => ['required', 'string', 'max:255'],
    'credit'      => ['nullable', 'string', 'max:255'],
    'sort_order'  => ['sometimes', 'integer', 'min:0'],
    'status'      => ['sometimes', 'in:active,inactive,archived'],
]
```

### Update Rules (`HeroSlideRule::updateRules()`)
```php
[
    'updateId'    => ['required', 'uuid', 'exists:hero_slides,id'],
    'image'       => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
    'description' => ['sometimes', 'string', 'max:255'],
    'caption'     => ['sometimes', 'string', 'max:255'],
    'credit'      => ['sometimes', 'nullable', 'string', 'max:255'],
    'sort_order'  => ['sometimes', 'integer', 'min:0'],
    'status'      => ['sometimes', 'in:active,inactive,archived'],
]
```

### Delete Rules (`HeroSlideRule::deleteRules()`)
```php
[
    'deleteId' => ['required', 'uuid', 'exists:hero_slides,id'],
]
```

---

## Testing & Payloads

### 1. Public Carousel List
```bash
curl -X GET "http://localhost:8000/api/v1/public/hero-slides/list" \
  -H "Accept: application/json"
```

### 2. Admin Create Slide
```bash
curl -X POST "http://localhost:8000/api/v1/auth/admin/hero-slides/store" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json" \
  -F "image=@/path/to/tower.jpg" \
  -F "description=Infrastructure tower in Uganda" \
  -F "caption=Infrastructure in Uganda" \
  -F "credit=Michael Starkie / Unsplash" \
  -F "sort_order=0" \
  -F "status=active"
```

### 3. Admin Update Slide
```bash
curl -X POST "http://localhost:8000/api/v1/auth/admin/hero-slides/update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json" \
  -F "updateId=01a0fc04-83f2-709f-b6bf-f2905e883bae" \
  -F "caption=Infrastructure in Kampala" \
  -F "image=@/path/to/new_image.webp"
```

### 4. Admin Delete Slide
```bash
curl -X DELETE "http://localhost:8000/api/v1/auth/admin/hero-slides/delete" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"deleteId": "01a0fc04-83f2-709f-b6bf-f2905e883bae"}'
```

---

## Standard Response Envelopes

### Success (`HeroSlideActionResponseData`)
```json
{
  "status": "success",
  "message": "Hero slide \"Infrastructure in Uganda\" created successfully.",
  "data": {
    "slide": {
      "id": "9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c",
      "src": "images/heroSlide/9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c/image.jpg",
      "description": "Infrastructure tower in Uganda",
      "caption": "Infrastructure in Uganda",
      "credit": "Michael Starkie / Unsplash",
      "sort_order": 0,
      "status": "active",
      "created_at": "2026-11-14T10:00:00+00:00",
      "updated_at": "2026-11-14T10:00:00+00:00"
    }
  },
  "errors": []
}
```

### Validation Error
```json
{
  "status": "error",
  "message": "Creation failed: The given data was invalid.",
  "data": {
    "slide": null
  },
  "errors": {
    "image": ["The image field is required."],
    "caption": ["The caption field is required."]
  }
}
```

---

## Design Decisions

1. **Two-Phase Creation inside DB Transaction**:
   - `HeroSlideService::create()` initiates a `DB::transaction`.
   - Generates a UUID and inserts the DB record with an empty `src` placeholder (`''`).
   - Uses the generated UUID to establish the directory and store `image.{ext}`.
   - Updates the DB row with the resulting `src`. If the upload fails, the transaction rolls back cleanly.
2. **Body-based Identifiers (`updateId`, `deleteId`)**:
   - Matches the convention of `Tier` and `Contact` modules so front-end client services (`axiosClient`) remain uniform across all admin management interfaces.
3. **MIME Validation & Security**:
   - Uses Laravel's built-in `image` rule alongside `mimes:jpg,jpeg,png,webp` to read byte-level headers and prevent malicious file masking.
```
