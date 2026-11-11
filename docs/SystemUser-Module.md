# SystemUser Module

Layered monolith module for **System Users** (`Super Admin`, `Finance Admin`,
`Membership Admin`) using a DTO → Repository → Service → Controller pipeline,
with **JWT authentication** via `tymon/jwt-auth`.

## Roles

| Role             | Constant            | Description                     |
|------------------|---------------------|---------------------------------|
| Super Admin      | `super_admin`       | Full system access              |
| Finance Admin    | `finance_admin`     | Finance module access           |
| Membership Admin | `membership_admin`  | Membership module access        |

## Directory Structure

```
app/Modules/SystemUser/
├── Controllers/
│   └── SystemUserController.php
├── DTOs/
│   ├── LogInDataRequest.php
│   ├── RegisterSystemUserRequestData.php
│   ├── SystemUserRegistrationResponseData.php
│   └── SystemUserResponseData.php
├── Interfaces/
│   └── SystemUserServiceInterface.php
├── Models/
│   └── SystemUserModel.php
├── Repositories/
│   └── SystemUserRepository.php
├── RepositoryInterfaces/
│   └── SystemUserRepositoryInterface.php
├── Rules/
│   └── SystemUserRegistrationRule.php
└── Services/
    └── SystemUserService.php
```

## Database Schema

### `system_users`

| Column          | Type      | Notes                                              |
|-----------------|-----------|----------------------------------------------------|
| id              | uuid PK   |                                                    |
| name            | string    |                                                    |
| email           | string    | unique                                             |
| password        | string    | bcrypt hashed                                      |
| role            | enum      | `super_admin`, `finance_admin`, `membership_admin` |
| is_active       | bool      | default `true`                                     |
| last_login_at   | timestamp | nullable                                           |
| last_login_ip   | string    | nullable                                           |
| remember_token  | string    | nullable                                           |
| timestamps      |           | created_at, updated_at                             |

## API Endpoints

### Public

| Method | Path                                          | Description         |
|--------|-----------------------------------------------|---------------------|
| POST   | `/api/v1/public/system-users/register`        | Register a new user |
| POST   | `/api/v1/public/system-users/login`           | Login (get JWT)     |

### Authenticated (`auth:system_users`)

| Method | Path                                          | Description                      |
|--------|-----------------------------------------------|----------------------------------|
| POST   | `/api/v1/auth/system-users/logout`            | Invalidate current JWT           |
| GET    | `/api/v1/auth/system-users/profile`           | Current user profile             |
| GET    | `/api/v1/auth/system-users/list`              | List users (with filters)        |
| POST   | `/api/v1/auth/system-users/update-profile`    | Update name / email / password   |
| DELETE | `/api/v1/auth/system-users/delete/{id}`       | Delete a system user             |

### List Filters (`GET /list`)

- `search`    — match on `name` or `email`
- `role`      — `super_admin` \| `finance_admin` \| `membership_admin`
- `is_active` — `1` \| `0`
- `sort`      — default `created_at`
- `order`     — `asc` \| `desc`

## Authentication Flow (JWT)

1. Client calls `POST /login` with `email` + `password`.
2. Service verifies hash, checks `is_active`, and issues a JWT via
   `Auth::guard('system_users')->login($user)`.
3. Response returns `{ status, message, data: { user, token } }`.
4. Client sends `Authorization: Bearer <token>` on subsequent calls.
5. `POST /logout` invalidates the current token via
   `Auth::guard('system_users')->logout()`.

## Test Data

``` json
{
  "name": "ISPAU",
  "email": "ispau@gmail.com",
  "password": "Ispau@123",
  "password_confirmation": "Ispau@123",
  "role": "super_admin"
}
```
## Response Envelope

```json
{
  "status": "success",
  "message": "Welcome back, Jane Doe.",
  "data": {
    "user": {
      "id": "…",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "super_admin",
      "is_active": true,
      "last_login_at": "2024-01-01T12:00:00+00:00",
      "created_at": "2024-01-01T11:00:00+00:00"
    },
    "token": "<jwt>"
  },
  "errors": []
}
```

## Setup Checklist

1. `composer require tymon/jwt-auth`
2. `php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"`
3. `php artisan jwt:secret`
4. Ensure `JwtAuthenticatable` provider is implemented (as used by `AdminUserModel`).
5. Register `SystemUserServiceProvider` in `config/app.php`.
6. Add `guards.system_users` + `providers.system_users` in `config/auth.php`.
7. `php artisan migrate`
