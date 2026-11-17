Here is the complete, comprehensive `README.md` for the **Banner Module**. You can save this directly to `app/Modules/Banner/README.md`.

```markdown
# Banner Module

Admin-managed CRUD module for banners — page-scoped promotional images displayed across the public-facing application (e.g., Homepage hero, Membership page, Directory page, Service pages).

Each banner maintains an image asset, an internal identifying name, an optional description/accessibility text, a target `page_name` scope, and a lifecycle status.

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

Built following the **Layered Modular Monolith** pattern used across the platform (`HeroSlide`, `Tier`, `Contact`, `Enquiry`, etc.):

- **Direct Twin of `HeroSlide`**: Uses the same controller action signatures, repository interfaces, and DTO envelope structure (`BannerActionResponseData`).
- **Page-Scoped**: Introduces the `page_name` column to allow the frontend to fetch specific banners per view (e.g., `?page=home`).
- **Ordering**: Defaults to `created_at DESC` across both admin and public queries (no manual sort order needed).
- **Attachment Management**: Integrates `BannerAttachmentService` (patterned after `ApplicationAttachmentService`) to manage directory creation, extension-safe file replacement, and disk cleanup.
- **Authentication**:
  - Admin endpoints require an existing JWT via the `admins` guard.
  - Public listing is unauthenticated for fast edge/client rendering.

---

## Directory Structure

```text
app/Modules/Banner/
├── Controllers/
│   └── BannerController.php
├── DTOs/
│   ├── BannerActionResponseData.php
│   ├── BannerRequestData.php
│   └── BannerResponseData.php
├── Interfaces/
│   └── BannerServiceInterface.php
├── Migrations/
│   └── 2026_11_14_000000_create_banners_table.php
├── Models/
│   └── BannerModel.php
├── Providers/
│   └── BannerServiceProvider.php
├── Repositories/
│   └── BannerRepository.php
├── RepositoryInterfaces/
│   └── BannerRepositoryInterface.php
├── Routes/
│   └── api.php
├── Rules/
│   └── BannerRule.php
└── Services/
    ├── BannerAttachmentService.php
    └── BannerService.php
```

---

## Scaffolding Commands

Run the following commands to scaffold all directories and boilerplate files:

```bash
# 1. Create directories
mkdir -p app/Modules/Banner/{Controllers,DTOs,Interfaces,Migrations,Models,Providers,Repositories,RepositoryInterfaces,Routes,Rules,Services}

# 2. Generate migration
php artisan make:migration create_banners_table --path=app/Modules/Banner/Migrations

# 3. Create module files
touch app/Modules/Banner/{Controllers/BannerController,DTOs/BannerActionResponseData,DTOs/BannerRequestData,DTOs/BannerResponseData,Interfaces/BannerServiceInterface,Models/BannerModel,Providers/BannerServiceProvider,Repositories/BannerRepository,RepositoryInterfaces/BannerRepositoryInterface,Rules/BannerRule,Services/BannerService,Services/BannerAttachmentService}.php app/Modules/Banner/Routes/api.php
```

---

## Database Schema

### Table: `banners`

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `UUID` | No | — | Primary key (auto-generated) |
| `image` | `string` | No | — | Relative path: `images/Banner/{id}/image.{ext}` |
| `name` | `string(255)` | No | — | Internal label / accessibility base |
| `description` | `string(255)` | Yes | `null` | Caption or secondary accessibility text |
| `page_name` | `string(100)` | No | — | Scoped page identifier (e.g., `home`, `membership`) |
| `status` | `enum` | No | `'active'` | `'active'`, `'inactive'`, `'archived'` |
| `created_at` | `timestamp` | Yes | `null` | Creation timestamp |
| `updated_at` | `timestamp` | Yes | `null` | Last update timestamp |

### Model Helper Methods (`BannerModel`)

```php
$banner->isActive();   // bool: status === 'active'
$banner->isInactive(); // bool: status === 'inactive'
$banner->isArchived(); // bool: status === 'archived'
```

---

## File Storage Layout

Assets follow an isolated, one-folder-per-banner storage design:

```text
public/
└── images/
    └── Banner/
        ├── 9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c/
        │   └── image.jpg
        ├── 01a0fc04-83f2-709f-b6bf-f2905e883bae/
        │   └── image.webp
        └── ...
```

- **Relative Paths**: Database stores only `images/Banner/{id}/image.{ext}`. The frontend resolves the final asset URL via `BASE_URL / asset()`.
- **Extension Replacement**: Updating an image removes any prior file (regardless of whether it was `.jpg`, `.png`, or `.webp`) before writing the new one.
- **Cascade Deletion**: Deleting the banner deletes the entire `{id}/` directory from public storage.

---

## API Endpoints

All admin endpoints require an Admin Bearer Token (`Authorization: Bearer <token>`).

| Method | URI | Auth | Content-Type | Purpose |
|---|---|---|---|---|
| `GET` | `/api/v1/public/banners/list` | None | — | Public list (all active banners) |
| `GET` | `/api/v1/public/banners/list?page={name}` | None | — | Public list scoped to a specific page |
| `GET` | `/api/v1/auth/admin/banners/list` | Admin | — | Admin list with search and filters |
| `GET` | `/api/v1/auth/admin/banners/show/{id}` | Admin | — | Fetch single banner details by UUID |
| `POST` | `/api/v1/auth/admin/banners/store` | Admin | `multipart/form-data` | Create banner and upload image |
| `POST` | `/api/v1/auth/admin/banners/update` | Admin | `multipart/form-data` | Update banner details/image |
| `DELETE` | `/api/v1/auth/admin/banners/delete` | Admin | `application/json` | Delete banner and disk assets |

### Admin Query Filters (`GET /api/v1/auth/admin/banners/list`)
- `search` (string): Matches `name`, `description`, or `page_name`.
- `status` (string): Filter by `active`, `inactive`, or `archived`.
- `page_name` (string): Filter by specific page scope (case-insensitive).
- `sort` (string): Sort column (default: `created_at`).
- `order` (string): `asc` or `desc` (default: `desc`).

---

## Validation Rules

### Store Rules (`BannerRule::createRules()`)
```php
[
    'image'       => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // Max 5MB
    'name'        => ['required', 'string', 'max:255'],
    'description' => ['nullable', 'string', 'max:255'],
    'page_name'   => ['required', 'string', 'max:100'],
    'status'      => ['sometimes', 'in:active,inactive,archived'],
]
```

### Update Rules (`BannerRule::updateRules()`)
```php
[
    'updateId'    => ['required', 'uuid', 'exists:banners,id'],
    'image'       => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
    'name'        => ['sometimes', 'string', 'max:255'],
    'description' => ['sometimes', 'nullable', 'string', 'max:255'],
    'page_name'   => ['sometimes', 'string', 'max:100'],
    'status'      => ['sometimes', 'in:active,inactive,archived'],
]
```

### Delete Rules (`BannerRule::deleteRules()`)
```php
[
    'deleteId' => ['required', 'uuid', 'exists:banners,id'],
]
```

---

## Testing & Payloads

### 1. Public List (Scoped to Page)
```bash
curl -X GET "http://localhost:8000/api/v1/public/banners/list?page=home" \
  -H "Accept: application/json"
```

### 2. Admin Create Banner
```bash
curl -X POST "http://localhost:8000/api/v1/auth/admin/banners/store" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json" \
  -F "image=@/path/to/hero.jpg" \
  -F "name=Homepage hero" \
  -F "description=Uganda internet infrastructure" \
  -F "page_name=home" \
  -F "status=active"
```

### 3. Admin Update Banner
```bash
curl -X POST "http://localhost:8000/api/v1/auth/admin/banners/update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json" \
  -F "updateId=01a0fc04-83f2-709f-b6bf-f2905e883bae" \
  -F "description=Updated caption" \
  -F "image=@/path/to/new_image.webp"
```

### 4. Admin Delete Banner
```bash
curl -X DELETE "http://localhost:8000/api/v1/auth/admin/banners/delete" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"deleteId": "01a0fc04-83f2-709f-b6bf-f2905e883bae"}'
```

---

## Standard Response Envelopes

### Success (`BannerActionResponseData`)
```json
{
  "status": "success",
  "message": "Banner \"Homepage hero\" created successfully.",
  "data": {
    "banner": {
      "id": "9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c",
      "image": "images/Banner/9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c/image.jpg",
      "name": "Homepage hero",
      "description": "Uganda internet infrastructure",
      "page_name": "home",
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
    "banner": null
  },
  "errors": {
    "image": ["The image field is required."],
    "page_name": ["The page name field is required."]
  }
}
```

---

## Design Decisions

1. **Dynamic `page_name` as String**:
   - Kept as a plain `string` rather than a fixed DB `enum` so marketing/content teams can add banners for new pages (`home`, `membership`, `directory`, `services`, etc.) without requiring database migrations.
   - Values are automatically lowercased on input (`strtolower(trim($pageName))`) to ensure case-insensitive matching.
2. **Two-Phase Creation inside DB Transaction**:
   - `create` runs inside `DB::transaction`.
   - Inserts the DB record with an empty `image` placeholder (`''`) to generate the UUID.
   - Writes the file to `public/images/Banner/{id}/image.{ext}`.
   - Updates the DB record with the relative path. If the disk write fails, the entire transaction rolls back.
3. **Payload Identifiers (`updateId`, `deleteId`)**:
   - Conforms strictly to the platform's module standards (`Contact`, `Tier`, `HeroSlide`), ensuring consistent frontend API client hooks.
4. **Binary Validation**:
   - Uses Laravel's `image` validator rule to verify actual image binary headers (magic numbers), preventing disguised file extensions.
```
