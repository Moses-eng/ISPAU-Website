# Tier Module

Admin-managed CRUD module for **service tiers and pricing packages** on
the GWT platform.

The module allows administrators to create, view, update, filter, and
delete tiers such as **Basic**, **Standard**, **Gold**, and
**Enterprise**. Each tier has a display name, monetary cost, optional
description, and lifecycle status.

It follows the platform's existing **layered modular-monolith
architecture** and mirrors the implementation conventions used by the
`Contact` module.

------------------------------------------------------------------------

## Table of Contents

-   [Overview](#overview)
-   [Features](#features)
-   [Architecture](#architecture)
-   [Data Model](#data-model)
-   [Lifecycle Statuses](#lifecycle-statuses)
-   [API Routes](#api-routes)
-   [Authentication](#authentication)
-   [Request and Response Format](#request-and-response-format)
-   [Validation Rules](#validation-rules)
-   [Filtering and Sorting](#filtering-and-sorting)
-   [Installation and Registration](#installation-and-registration)
-   [API Usage Examples](#api-usage-examples)
-   [Error Handling](#error-handling)
-   [Implementation Notes](#implementation-notes)

------------------------------------------------------------------------

## Overview

  Item                  Details
  --------------------- ------------------------------------------
  Module                `Tier`
  Table                 `tiers`
  Primary key           UUID
  Base admin route      `/api/v1/auth/admin/tiers`
  Public create route   `/api/v1/public/tiers/store`
  Authentication        Existing `admins` guard for admin routes
  Uploads               Not supported
  Data handled          Plain text, decimal values, and status

The public `store` endpoint is intentionally unauthenticated. It can be
used by the GWT website or storefront to submit a tier without an admin
access token. All listing, viewing, updating, and deleting operations
remain protected by the existing admin authentication guard.

## Features

-   Create a tier with a name, cost, optional description, and status.
-   List all tiers.
-   Retrieve a tier by its UUID.
-   Update an existing tier using `updateId`.
-   Delete a tier using `deleteId`.
-   Search by tier name or description.
-   Filter by lifecycle status and minimum/maximum cost.
-   Sort results by an allowed column in ascending or descending order.
-   Return a consistent API response envelope.
-   Generate UUID primary keys automatically.
-   Use database transactions when creating records.

## Architecture

The module uses the same layered structure and conventions as the
platform's `Contact` module.

``` text
app/Modules/Tier/
├── Controllers/
│   └── TierController.php
├── DTOs/
│   ├── TierResponseData.php
│   ├── TierActionResponseData.php
│   └── TierRequestData.php
├── Interfaces/
│   └── TierServiceInterface.php
├── Migrations/
│   └── 2026_11_14_000000_create_tiers_table.php
├── Models/
│   └── TierModel.php
├── Providers/
│   └── TierServiceProvider.php
├── Repositories/
│   └── TierRepository.php
├── RepositoryInterfaces/
│   └── TierRepositoryInterface.php
├── Routes/
│   └── api.php
├── Rules/
│   └── TierRule.php
└── Services/
    └── TierService.php
```

### Layer responsibilities

  -----------------------------------------------------------------------
  Layer                               Responsibility
  ----------------------------------- -----------------------------------
  Controller                          Receives HTTP requests, invokes the
                                      service, and returns API responses.

  Request DTO                         Transfers and normalizes incoming
                                      request data.

  Response DTO                        Formats a tier for API output.

  Action response DTO                 Builds the standard response
                                      envelope.

  Service interface                   Defines the operations exposed by
                                      the service layer.

  Service                             Applies business logic and
                                      coordinates repository operations.

  Repository interface                Defines the data-access contract.

  Repository                          Performs database queries and
                                      persistence.

  Model                               Represents the `tiers` table and
                                      its model helpers/casts.

  Rules                               Defines create and update
                                      validation rules.

  Routes                              Declares public and admin API
                                      endpoints.

  Service provider                    Registers the module's
                                      interface-to-implementation
                                      bindings and module services.

  Migration                           Creates the `tiers` database table.
  -----------------------------------------------------------------------

## Data Model

### `tiers` table

  -------------------------------------------------------------------------
  Column           Type                           Required Description
  ---------------- ----------------- --------------------- ----------------
  `id`             UUID, primary key                   Yes Automatically
                                                           generated unique
                                                           identifier.

  `name`           `string(255)`                       Yes Display name of
                                                           the tier.

  `cost`           `decimal(12,2)`                     Yes Tier price; must
                                                           be zero or
                                                           greater.

  `description`    `text`, nullable                     No Optional
                                                           marketing or
                                                           internal
                                                           description.

  `status`         Enum/string                         Yes `active`,
                                                           `inactive`, or
                                                           `archived`;
                                                           defaults to
                                                           `active`.

  `created_at`     Timestamp                     Automatic Record creation
                                                           time.

  `updated_at`     Timestamp                     Automatic Last update
                                                           time.
  -------------------------------------------------------------------------

### Model

Model: `App\Modules\Tier\Models\TierModel`

The model uses UUIDs and casts `cost` to a two-decimal-place value.

``` php
$tier->isActive();   // true when status is active
$tier->isInactive(); // true when status is inactive
$tier->isArchived(); // true when status is archived
```

The API response DTO exposes `cost` as a numeric JSON value.

## Lifecycle Statuses

  -----------------------------------------------------------------------
  Status                  Meaning                 Availability
  ----------------------- ----------------------- -----------------------
  `active`                Live tier currently     Available to new
                          offered to customers.   customers.

  `inactive`              Temporarily paused      Not currently offered.
                          tier.                   

  `archived`              Retired tier retained   Not offered to new
                          for historical or       customers.
                          reporting purposes.     
  -----------------------------------------------------------------------

New tiers default to `active` when no status is supplied.

## API Routes

### Admin routes

All admin routes require a valid admin JWT issued through the existing
`admins` guard.

  --------------------------------------------------------------------------------------
  Method                  Endpoint                               Description
  ----------------------- -------------------------------------- -----------------------
  `GET`                   `/api/v1/auth/admin/tiers/list`        List tiers, optionally
                                                                 filtered and sorted.

  `GET`                   `/api/v1/auth/admin/tiers/show/{id}`   Retrieve one tier by
                                                                 UUID.

  `POST`                  `/api/v1/auth/admin/tiers/update`      Update a tier using
                                                                 `updateId`.

  `DELETE`                `/api/v1/auth/admin/tiers/delete`      Delete a tier using
                                                                 `deleteId`.
  --------------------------------------------------------------------------------------

### Public route

  ------------------------------------------------------------------------------------
  Method            Endpoint                       Authentication    Description
  ----------------- ------------------------------ ----------------- -----------------
  `POST`            `/api/v1/public/tiers/store`   Not required      Create a tier.

  ------------------------------------------------------------------------------------

> **Important:** The public `store` route is deliberately outside the
> admin-authenticated route group. Protect it with appropriate request
> validation and, where suitable for the deployment, rate limiting and
> monitoring. Do not expose admin update or delete operations publicly.

## Authentication

Send the admin JWT in the `Authorization` header for every admin
endpoint.

``` http
Authorization: Bearer <admin-token>
Accept: application/json
```

The module does **not** define its own guard, login endpoint, token
issuance, or authentication flow. It relies on the existing `admins`
guard configured by the AdminUser module.

The public `store` endpoint does not require the `Authorization` header.

## Request and Response Format

### Standard response envelope

Responses follow the platform's standard structure:

``` json
{
  "status": "success",
  "message": "Tiers fetched successfully.",
  "data": {
    "tier": null,
    "items": [],
    "total": 0
  },
  "errors": []
}
```

The `data` object varies by operation:

-   **List:** `tier: null`, `items: [...]`, and `total`.
-   **Show/create/update:** `tier: {...}`.
-   **Delete:** `tier: null`.

### Tier resource

``` json
{
  "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
  "name": "Gold",
  "cost": 199.99,
  "description": "Premium tier — priority support and additional benefits.",
  "status": "active",
  "created_at": "2026-11-14T09:49:09+00:00",
  "updated_at": "2026-11-14T09:49:09+00:00"
}
```

## Validation Rules

### Create

  Field           Rules
  --------------- --------------------------------------------------------
  `name`          Required, string, maximum 255 characters.
  `cost`          Required, numeric, minimum `0`.
  `description`   Optional, nullable string.
  `status`        Optional; must be `active`, `inactive`, or `archived`.

### Update

  Field           Rules
  --------------- --------------------------------------------------------
  `updateId`      Required identifier for the tier being updated.
  `name`          Optional, string, maximum 255 characters.
  `cost`          Optional, numeric, minimum `0`.
  `description`   Optional, nullable string.
  `status`        Optional; must be `active`, `inactive`, or `archived`.

An update can contain only the fields that need to change. The
`updateId` identifies the existing record and is not a tier column.

## Filtering and Sorting

The list endpoint accepts the following query parameters:

  -----------------------------------------------------------------------
  Parameter               Description             Example
  ----------------------- ----------------------- -----------------------
  `search`                Searches tier name and  `search=gold`
                          description.            

  `status`                Filters by lifecycle    `status=active`
                          status.                 

  `min_cost`              Inclusive minimum cost. `min_cost=50`

  `max_cost`              Inclusive maximum cost. `max_cost=200`

  `sort`                  Sort column; defaults   `sort=cost`
                          to `created_at`.        

  `order`                 Sort direction: `asc`   `order=asc`
                          or `desc`; defaults to  
                          `desc`.                 
  -----------------------------------------------------------------------

Example:

``` http
GET /api/v1/auth/admin/tiers/list?search=gold&status=active&min_cost=50&max_cost=200&sort=cost&order=asc
```

For safe query construction, the implementation should restrict `sort`
to an explicit allowlist of supported database columns and normalize
`order` to `asc` or `desc`.

## Installation and Registration

1.  Ensure the module files are present under `app/Modules/Tier/`.
2.  Register `TierServiceProvider` using the same provider-registration
    convention as the other modules in the application.
3.  Confirm that the provider binds:
    -   `TierServiceInterface` to `TierService`.
    -   `TierRepositoryInterface` to `TierRepository`.
4.  Confirm that the module's `Routes/api.php` file is loaded by the
    application's API route registration mechanism.
5.  Run the migration using the project's normal module-migration
    process.

If the project runs this migration directly through Laravel's Artisan
path option, the command is:

``` bash
php artisan migrate --path=app/Modules/Tier/Migrations
```

Use the application's established migration workflow if module
migrations are registered or loaded centrally. Avoid running the
migration twice through separate mechanisms.

After registration, verify that the route list contains the five
endpoints documented above:

``` bash
php artisan route:list --path=tiers
```

## API Usage Examples

Base URL used in the examples:

``` text
http://localhost:8000
```

Replace `<admin-token>` with a valid JWT issued by the existing admins
guard.

### 1. List tiers

``` bash
curl -X GET \
  "http://localhost:8000/api/v1/auth/admin/tiers/list" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json"
```

### 2. List tiers with filters

``` bash
curl -X GET \
  "http://localhost:8000/api/v1/auth/admin/tiers/list?search=gold&status=active&min_cost=50&max_cost=200&sort=cost&order=asc" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json"
```

### 3. Show a tier

``` bash
curl -X GET \
  "http://localhost:8000/api/v1/auth/admin/tiers/show/01a0fc04-83f2-709f-b6bf-f2905e883bae" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Accept: application/json"
```

### 4. Create a tier (public)

``` bash
curl -X POST \
  "http://localhost:8000/api/v1/public/tiers/store" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Gold",
    "cost": 199.99,
    "description": "Premium tier — priority support and additional benefits.",
    "status": "active"
  }'
```

The `status` field may be omitted to use the default `active` status.

### 5. Update a tier

``` bash
curl -X POST \
  "http://localhost:8000/api/v1/auth/admin/tiers/update" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "updateId": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
    "cost": 179.99,
    "status": "inactive"
  }'
```

Only the supplied fields are changed.

### 6. Delete a tier

``` bash
curl -X DELETE \
  "http://localhost:8000/api/v1/auth/admin/tiers/delete" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "deleteId": "01a0fc04-83f2-709f-b6bf-f2905e883bae"
  }'
```

## Sample Responses

### Successful list

``` json
{
  "status": "success",
  "message": "Tiers fetched successfully.",
  "data": {
    "tier": null,
    "items": [
      {
        "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
        "name": "Gold",
        "cost": 199.99,
        "description": "Premium tier — priority support and additional benefits.",
        "status": "active",
        "created_at": "2026-11-14T09:49:09+00:00",
        "updated_at": "2026-11-14T09:49:09+00:00"
      }
    ],
    "total": 1
  },
  "errors": []
}
```

### Successful create

``` json
{
  "status": "success",
  "message": "Tier Gold created successfully.",
  "data": {
    "tier": {
      "id": "9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c",
      "name": "Gold",
      "cost": 199.99,
      "description": "Premium tier — priority support and additional benefits.",
      "status": "active",
      "created_at": "2026-11-14T10:05:08+00:00",
      "updated_at": "2026-11-14T10:05:08+00:00"
    }
  },
  "errors": []
}
```

### Validation failure

``` json
{
  "status": "error",
  "message": "Creation failed: The given data was invalid.",
  "data": {
    "tier": null
  },
  "errors": {
    "name": [
      "The name field is required."
    ],
    "cost": [
      "The cost field is required."
    ]
  }
}
```

### Tier not found

``` json
{
  "status": "error",
  "message": "Tier not found.",
  "data": {
    "tier": null
  },
  "errors": []
}
```

## Error Handling

The module uses the same response envelope for successful and failed
operations.

  -----------------------------------------------------------------------
  Scenario                            Expected behavior
  ----------------------------------- -----------------------------------
  Valid request                       Return `status: success` and the
                                      relevant data.

  Invalid create/update data          Return `status: error` with
                                      field-level validation errors.

  Unknown UUID                        Return a not-found response with
                                      `data.tier` set to `null`.

  Missing/invalid admin token         The existing admins guard rejects
                                      the admin request.

  Public create request               No admin token is required; payload
                                      validation still applies.
  -----------------------------------------------------------------------

## Implementation Notes

-   **Contact parity:** The module intentionally follows the Contact
    module's route shape, controller action pattern, DTO envelope, and
    service-provider wiring.
-   **No separate authentication:** Admin endpoints rely on the existing
    `admins` guard. Do not add a Tier-specific JWT guard.
-   **Public create only:** `store` is public; list, show, update, and
    delete are admin-only.
-   **Money precision:** Store monetary values as `DECIMAL(12,2)`, not
    floating-point database columns. The model uses a two-decimal cast;
    the response DTO serializes the cost as a JSON number.
-   **Nullable description:** A tier can be created without a
    description.
-   **UUID identity:** The primary key is generated automatically using
    Laravel's UUID support.
-   **Create transaction:** Tier creation is wrapped in a database
    transaction, following the existing service-layer convention.
-   **No file handling:** The module does not upload, store, or manage
    files.
-   **Historical records:** `archived` is a lifecycle status, not a
    soft-delete flag. Deletion behavior remains the behavior implemented
    by the repository/model.

------------------------------------------------------------------------

**Module:** Tier\
**Platform:** GWT\
**Architecture:** Layered Modular Monolith\
**Reference implementation:** Contact module
