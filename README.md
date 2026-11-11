<?php

namespace App\Modules\Enquiry\DTOs;

class EnquiryActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?EnquiryResponseData $enquiry = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?EnquiryResponseData $enquiry = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            enquiry: $enquiry,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            enquiry: null,
            errors:  $errors,
            payload: [],
        );
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function toArray(): array
    {
        return [
            'status'  => $this->status,
            'message' => $this->message,
            'data'    => [
                'enquiry' => $this->enquiry?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
<?php

namespace App\Modules\Enquiry\DTOs;

use Illuminate\Http\Request;

class EnquiryRequestData
{
    public function __construct(
        public readonly string  $name,
        public readonly string  $email,
        public readonly string  $contact,
        public readonly ?string $location = null,
        public readonly ?string $description = null,
        public readonly string  $status = 'active',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name:        $request->input('name'),
            email:       strtolower(trim($request->input('email'))),
            contact:     $request->input('contact'),
            location:    $request->input('location'),
            description: $request->input('description'),
            status:      $request->input('status', 'active'),
        );
    }

    public function toArray(): array
    {
        return [
            'name'        => $this->name,
            'email'       => $this->email,
            'contact'     => $this->contact,
            'location'    => $this->location,
            'description' => $this->description,
            'status'      => $this->status,
        ];
    }
}
<?php

namespace App\Modules\Enquiry\DTOs;

use App\Modules\Enquiry\Models\EnquiryModel;

class EnquiryResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly string  $email,
        public readonly string  $contact,
        public readonly ?string $location,
        public readonly ?string $description,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(EnquiryModel $m): self
    {
        return new self(
            id:          $m->id,
            name:        $m->name,
            email:       $m->email,
            contact:     $m->contact,
            location:    $m->location,
            description: $m->description,
            status:      $m->status,
            created_at:  optional($m->created_at)->toIso8601String(),
            updated_at:  optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'email'       => $this->email,
            'contact'     => $this->contact,
            'location'    => $this->location,
            'description' => $this->description,
            'status'      => $this->status,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
<?php

namespace App\Modules\Enquiry\Interfaces;

use App\Modules\Enquiry\DTOs\EnquiryActionResponseData;
use App\Modules\Enquiry\DTOs\EnquiryRequestData;
use App\Modules\Enquiry\Models\EnquiryModel;

interface EnquiryServiceInterface
{
    public function listAll(array $filters = []): EnquiryActionResponseData;
    public function show(string $id): EnquiryActionResponseData;
    public function create(EnquiryRequestData $data): EnquiryActionResponseData;
    public function update(EnquiryModel $enquiry, EnquiryRequestData $data): EnquiryActionResponseData;
    public function delete(EnquiryModel $enquiry): EnquiryActionResponseData;
}
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enquiries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('contact', 30);
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive', 'archived'])->default('active');
            $table->timestamps();

            $table->index('status');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enquiries');
    }
};
<?php

namespace App\Modules\Enquiry\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnquiryModel extends Model
{
    use HasUuids;

    protected $table = 'enquiries';

    protected $fillable = [
        'name', 'email', 'contact', 'location', 'description', 'status',
    ];

    protected $casts = [
        // status is a plain enum string — no cast needed
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isInactive(): bool { return $this->status === 'inactive'; }
    public function isArchived(): bool { return $this->status === 'archived'; }
}
<?php

namespace App\Modules\Enquiry\Repositories;

use App\Modules\Enquiry\Models\EnquiryModel;
use App\Modules\Enquiry\RepositoryInterfaces\EnquiryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EnquiryRepository implements EnquiryRepositoryInterface
{
    public function __construct(private readonly EnquiryModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across name / email / contact / location / description ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name',        'like', "%{$search}%")
                  ->orWhere('email',     'like', "%{$search}%")
                  ->orWhere('contact',   'like', "%{$search}%")
                  ->orWhere('location',  'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // ---- Filter by status ----
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // ---- Filter by location ----
        if (! empty($filters['location'])) {
            $query->where('location', 'like', "%{$filters['location']}%");
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?EnquiryModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): EnquiryModel
    {
        return $this->model->create($data);
    }

    public function update(EnquiryModel $enquiry, array $data): EnquiryModel
    {
        $enquiry->update($data);
        return $enquiry->fresh();
    }

    public function delete(EnquiryModel $enquiry): bool
    {
        return (bool) $enquiry->delete();
    }
}
<?php

namespace App\Modules\Enquiry\RepositoryInterfaces;

use App\Modules\Enquiry\Models\EnquiryModel;
use Illuminate\Database\Eloquent\Collection;

interface EnquiryRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?EnquiryModel;
    public function create(array $data): EnquiryModel;
    public function update(EnquiryModel $enquiry, array $data): EnquiryModel;
    public function delete(EnquiryModel $enquiry): bool;
}
<?php

namespace App\Modules\Enquiry\Rules;

use Illuminate\Validation\Rule;

class EnquiryRule
{
    public static function createRules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|max:255',
            'contact'     => 'required|string|max:30',
            'location'    => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }

    public static function updateRules(string $enquiryId): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'email'       => ['sometimes', 'email', 'max:255'],
            'contact'     => 'sometimes|string|max:30',
            'location'    => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }
}
<?php

namespace App\Modules\Enquiry\Services;

use App\Modules\Enquiry\Interfaces\EnquiryServiceInterface;
use App\Modules\Enquiry\DTOs\EnquiryActionResponseData;
use App\Modules\Enquiry\DTOs\EnquiryRequestData;
use App\Modules\Enquiry\DTOs\EnquiryResponseData;
use App\Modules\Enquiry\Models\EnquiryModel;
use App\Modules\Enquiry\RepositoryInterfaces\EnquiryRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnquiryService implements EnquiryServiceInterface
{
    public function __construct(
        private readonly EnquiryRepositoryInterface $repository,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): EnquiryActionResponseData
    {
        try {
            $enquiries = $this->repository->all($filters);

            $items = $enquiries
                ->map(fn (EnquiryModel $e) => EnquiryResponseData::fromModel($e)->toArray())
                ->values()
                ->all();

            return EnquiryActionResponseData::success(
                message: 'Enquiries fetched successfully.',
                enquiry: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Enquiry list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return EnquiryActionResponseData::error('Failed to fetch enquiries.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): EnquiryActionResponseData
    {
        $enquiry = $this->repository->findById($id);
        if (! $enquiry) {
            return EnquiryActionResponseData::error('Enquiry not found.');
        }

        return EnquiryActionResponseData::success(
            message: 'Enquiry fetched successfully.',
            enquiry: EnquiryResponseData::fromModel($enquiry),
        );
    }

    // ==================== CREATE ====================

    public function create(EnquiryRequestData $data): EnquiryActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $enquiry = $this->repository->create($data->toArray());

                Log::info('Enquiry created', ['enquiry_id' => $enquiry->id]);

                return EnquiryActionResponseData::success(
                    message: "Enquiry from {$enquiry->name} created successfully.",
                    enquiry: EnquiryResponseData::fromModel($enquiry),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Enquiry creation failed', ['error' => $e->getMessage()]);
            return EnquiryActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(EnquiryModel $enquiry, EnquiryRequestData $data): EnquiryActionResponseData
    {
        try {
            $updated = $this->repository->update($enquiry, $data->toArray());

            return EnquiryActionResponseData::success(
                message: 'Enquiry updated successfully.',
                enquiry: EnquiryResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Enquiry update failed', [
                'enquiry_id' => $enquiry->id,
                'error'      => $e->getMessage(),
            ]);
            return EnquiryActionResponseData::error('Failed to update enquiry.');
        }
    }

    // ==================== DELETE ====================

    public function delete(EnquiryModel $enquiry): EnquiryActionResponseData
    {
        try {
            $this->repository->delete($enquiry);

            Log::info('Enquiry deleted', [
                'enquiry_id' => $enquiry->id,
                'name'       => $enquiry->name,
            ]);

            return EnquiryActionResponseData::success(
                message: 'Enquiry deleted successfully.',
                enquiry: null,
            );
        } catch (\Throwable $e) {
            Log::error('Enquiry delete failed', [
                'enquiry_id' => $enquiry->id,
                'error'      => $e->getMessage(),
            ]);
            return EnquiryActionResponseData::error('Failed to delete enquiry.');
        }
    }
}
<?php

namespace App\Modules\Enquiry\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Enquiry\DTOs\EnquiryRequestData;
use App\Modules\Enquiry\Interfaces\EnquiryServiceInterface;
use App\Modules\Enquiry\Models\EnquiryModel;
use App\Modules\Enquiry\Rules\EnquiryRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnquiryController extends Controller
{
    public function __construct(
        private readonly EnquiryServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/enquiries/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/enquiries/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/auth/admin/enquiries/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(EnquiryRule::createRules());

        $response = $this->service->create(
            EnquiryRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/enquiries/update
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $enquiry = EnquiryModel::find($request->input('updateId'));
        if (! $enquiry) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Enquiry not found.',
                'data'    => ['enquiry' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(EnquiryRule::updateRules($enquiry->id));

        $response = $this->service->update(
            $enquiry,
            EnquiryRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/enquiries/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $enquiry = EnquiryModel::find($request->input('deleteId'));
        if (! $enquiry) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Enquiry not found.',
                'data'    => ['enquiry' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($enquiry);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}

<?php

use App\Modules\Enquiry\Controllers\EnquiryController;
use Illuminate\Support\Facades\Route;


Route::prefix('v1/public/enquiries')
    ->group(function () {
        Route::post  ('/store',           [EnquiryController::class, 'store']);
});

Route::prefix('v1/auth/admin/enquiries')
    ->group(function () {
        Route::get   ('/list',            [EnquiryController::class, 'index']);
        Route::get   ('/show/{id}',       [EnquiryController::class, 'show']);
        Route::post  ('/update',          [EnquiryController::class, 'update']);
        Route::delete('/delete',          [EnquiryController::class, 'destroy']);
    });

Enquiry Module Implementation

# Enquiry Module

Admin-managed CRUD module for **enquiries** — the free-form contact
submissions made by visitors and prospective customers on the GWT platform
(e.g. "I'd like a quote for solar installation in Kampala", "Do you cover
Mbarara for plumbing?").

Built on the same layered-modular-monolith pattern used by **FAQ**,
**FAQCategory**, **ServiceOption**, **SubService**, **ServiceName**,
**ServiceGroup**, **Admin Users**, and the **Enterprise * User** family.

`Enquiry` is a **direct twin** of `ServiceName` / `FAQCategory`:

- **Same routes**, **same controller methods**, **same DTO envelope**, **same
  service provider wiring** — the only differences are the table
  (`enquiries`), the route prefix (`/enquiries`), the DTO field (`enquiry`),
  and the extra contact/location/description columns.
- **No JWT guard of its own** — all routes are protected by the existing
  `admins` guard from the AdminUser module.
- **No auth flow**, **no file uploads** — just plain text CRUD.

---

## Architecture

```bash
app/Modules/Enquiry/
├── Controllers/
│   └── EnquiryController.php
├── DTOs/
│   ├── EnquiryResponseData.php
│   ├── EnquiryActionResponseData.php
│   └── EnquiryRequestData.php
├── Interfaces/
│   └── EnquiryServiceInterface.php
├── Migrations/
│   └── 2026_10_04_000000_create_enquiries_table.php
├── Models/
│   └── EnquiryModel.php
├── Repositories/
│   └── EnquiryRepository.php
├── RepositoryInterfaces/
│   └── EnquiryRepositoryInterface.php
├── Rules/
│   └── EnquiryRule.php
└── Services/
    └── EnquiryService.php
```


---

## Files

| Layer             | Path                                                                            |
|-------------------|---------------------------------------------------------------------------------|
| Migration         | `app/Modules/Enquiry/Migrations/*_create_enquiries_table.php`                   |
| Model             | `app/Modules/Enquiry/Models/EnquiryModel.php`                                   |
| Request DTO       | `app/Modules/Enquiry/DTOs/EnquiryRequestData.php`                               |
| Response DTO      | `app/Modules/Enquiry/DTOs/EnquiryResponseData.php`                              |
| Envelope DTO      | `app/Modules/Enquiry/DTOs/EnquiryActionResponseData.php`                        |
| Repository Iface  | `app/Modules/Enquiry/RepositoryInterfaces/EnquiryRepositoryInterface.php`       |
| Repository        | `app/Modules/Enquiry/Repositories/EnquiryRepository.php`                        |
| Service Iface     | `app/Modules/Enquiry/Interfaces/EnquiryServiceInterface.php`                    |
| Service           | `app/Modules/Enquiry/Services/EnquiryService.php`                               |
| Validation        | `app/Modules/Enquiry/Rules/EnquiryRule.php`                                     |
| Controller        | `app/Modules/Enquiry/Controllers/EnquiryController.php`                         |
| Routes            | `routes/enquiry.php`                                                            |
| Provider Bindings | `app/Providers/AppServiceProvider.php`                                          |

---

## Fields — `enquiries`

| Column        | Type                                    | Notes                              |
|---------------|-----------------------------------------|------------------------------------|
| `id`          | UUID (PK)                               | auto-generated                     |
| `name`        | string                                  | required — the enquirer's name     |
| `email`       | string                                  | required — contact email           |
| `contact`     | string (30)                             | required — phone / mobile          |
| `location`    | string (nullable)                       | e.g. "Kampala Central"             |
| `description` | text (nullable)                         | free-form message                  |
| `status`      | enum(active/inactive/archived)          | default `active`                   |
| `created_at`  | timestamp                               | auto                               |
| `updated_at`  | timestamp                               | auto                               |

**Status values:**

| Status     | Description                                                |
|------------|------------------------------------------------------------|
| `active`   | Open / new — actionable (default)                           |
| `inactive` | Handled / closed                                            |
| `archived` | Retired — kept for historical / reporting purposes          |

Model helpers on `EnquiryModel`:

```bash
$enquiry->isActive();   // status === 'active'
$enquiry->isInactive(); // status === 'inactive'
$enquiry->isArchived(); // status === 'archived'
```

## Endpoints

```bash 
All routes require the admin JWT (Authorization: Bearer <token> issued by
the admins guard).

Method	URI	Description
GET	/api/v1/auth/admin/enquiries/list	List all enquiries
GET	/api/v1/auth/admin/enquiries/show/{id}	Show a single enquiry
POST	/api/v1/auth/admin/enquiries/store	Create a new enquiry
POST	/api/v1/auth/admin/enquiries/update	Update an existing enquiry
DELETE	/api/v1/auth/admin/enquiries/delete	Delete an enquiry
```

## Testing
```bash
{
  "testing": {
    "list": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/enquiries/list",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "list_with_filters": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/enquiries/list?search=solar&status=active&location=Kampala",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "show": {
      "method": "GET",
      "url": "http://localhost:8000/api/v1/auth/admin/enquiries/show/01a0fc04-83f2-709f-b6bf-f2905e883bae",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Accept": "application/json"
      }
    },
    "store": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/public/enquiries/store",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "name": "Amina Nakato",
        "email": "amina@example.com",
        "contact": "+256771234567",
        "location": "Kampala Central",
        "description": "I'd like a quote for solar panel installation on a 3-bedroom house.",
        "status": "active"
      }
    },
    "update": {
      "method": "POST",
      "url": "http://localhost:8000/api/v1/auth/admin/enquiries/update",
      "headers": {
        "Authorization": "Bearer <admin-token>",
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      "body": {
        "updateId": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
        "description": "Followed up — quote sent on 2026-10-05.",
        "status": "inactive"
      }
    },
    "delete": {
      "method": "DELETE",
      "url": "http://localhost:8000/api/v1/auth/admin/enquiries/delete",
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
      "message": "Enquiries fetched successfully.",
      "data": {
        "enquiry": null,
        "items": [
          {
            "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
            "name": "Amina Nakato",
            "email": "amina@example.com",
            "contact": "+256771234567",
            "location": "Kampala Central",
            "description": "I'd like a quote for solar panel installation on a 3-bedroom house.",
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
      "message": "Enquiry fetched successfully.",
      "data": {
        "enquiry": {
          "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "name": "Amina Nakato",
          "email": "amina@example.com",
          "contact": "+256771234567",
          "location": "Kampala Central",
          "description": "I'd like a quote for solar panel installation on a 3-bedroom house.",
          "status": "active",
          "created_at": "2026-10-05T09:49:09+00:00",
          "updated_at": "2026-10-05T09:49:09+00:00"
        }
      },
      "errors": []
    },
    "store_success": {
      "status": "success",
      "message": "Enquiry from Amina Nakato created successfully.",
      "data": {
        "enquiry": {
          "id": "9b1c3e7a-8f2d-4e5b-9a1c-7d6e5f4a3b2c",
          "name": "Amina Nakato",
          "email": "amina@example.com",
          "contact": "+256771234567",
          "location": "Kampala Central",
          "description": "I'd like a quote for solar panel installation on a 3-bedroom house.",
          "status": "active",
          "created_at": "2026-10-05T10:05:08+00:00",
          "updated_at": "2026-10-05T10:05:08+00:00"
        }
      },
      "errors": []
    },
    "update_success": {
      "status": "success",
      "message": "Enquiry updated successfully.",
      "data": {
        "enquiry": {
          "id": "01a0fc04-83f2-709f-b6bf-f2905e883bae",
          "name": "Amina Nakato",
          "email": "amina@example.com",
          "contact": "+256771234567",
          "location": "Kampala Central",
          "description": "Followed up — quote sent on 2026-10-05.",
          "status": "inactive",
          "created_at": "2026-10-05T09:49:09+00:00",
          "updated_at": "2026-10-05T10:15:30+00:00"
        }
      },
      "errors": []
    },
    "delete_success": {
      "status": "success",
      "message": "Enquiry deleted successfully.",
      "data": { "enquiry": null },
      "errors": []
    },
    "not_found": {
      "status": "error",
      "message": "Enquiry not found.",
      "data": { "enquiry": null },
      "errors": []
    }
  }
}
```
import { BASE_URL } from "./env";

type ResourceId = string | number;

// ============================================================
// HELP ENQUIRIES — PUBLIC
// ============================================================
export const API_PUBLIC_HELP_ENQUIRIES_CREATE = BASE_URL + "/api/v1/public/help-enquiries/store";


// ============================================================
// HELP ENQUIRIES
// ============================================================
export const API_ADMIN_HELP_ENQUIRIES_LIST          = BASE_URL + "/api/v1/auth/admin/help-enquiries/list";
export const API_ADMIN_HELP_ENQUIRIES_SHOW          = (id: ResourceId) => BASE_URL + `/api/v1/auth/admin/help-enquiries/show/${id}`;
export const API_ADMIN_HELP_ENQUIRIES_UPDATE        = BASE_URL + "/api/v1/auth/admin/help-enquiries/update";
export const API_ADMIN_HELP_ENQUIRIES_UPDATE_STATUS = BASE_URL + "/api/v1/auth/admin/help-enquiries/update-status";
export const API_ADMIN_HELP_ENQUIRIES_DELETE        = BASE_URL + "/api/v1/auth/admin/help-enquiries/delete";

// src/apiServices/webApiService.ts

import axiosClient from './axiosClient';
import {
API_ADMIN_FAQS_PUBLIC_LIST,
API_ADMIN_ENQUIRIES_CREATE,
API_PUBLIC_HELP_ENQUIRIES_CREATE,
API_PUBLIC_SERVICES_LIST,
} from './APIs';

// ============================================================
// FAQS
// ============================================================

export interface WebFaq {
id: string;
category_name: string | null;
question: string;
answer: string;
}

export interface WebFaqListResponse {
success: boolean;
message: string;
data: WebFaq[] | null;
}

// ============================================================
// SERVICES
// ============================================================

export interface WebServiceItem {
id: string;
slug: string;
name: string;
description: string | null;
name_id: string | null;
name_label: string | null;
group_id: string | null;
group_label: string | null;
options: Record<string, string>; // { [uuid]: name }
sub_services: Record<string, string>; // { [uuid]: name }
estimate: [number, number] | number[] | null;
icon: string | null;
image: string | null;
image_url: string | null;
status: string;
created_at: string;
updated_at: string;
}

// Backward-compatibility alias
export type Services = WebServiceItem;

export interface ServicesListResponse {
success: boolean;
message: string;
data: WebServiceItem[] | null;
}

// ============================================================
// BUSINESS ENQUIRY (general pipeline)
// ============================================================

export interface BusinessEnquiryPayload {
name: string;
email: string;
contact?: string | null;
location?: string | null;
description: string;
}

// ============================================================
// HELP ENQUIRY (Help centre form)
// ============================================================

export interface HelpEnquiryPayload {
name: string;
email: string;
question: string;
}

export interface WebEnquiryResponse {
success: boolean;
message: string;
data: unknown | null;
fieldErrors?: Record<string, string> | null;
}

// ============================================================
// ERROR HANDLING
// ============================================================

const handleError = (
error: unknown,
fallback: string
): {
success: false;
message: string;
data: null;
fieldErrors: Record<string, string> | null;
} => {
const e = error as {
    response?: {
    status?: number;
    data?: { message?: string; errors?: Record<string, string[]> };
    };
    request?: unknown;
};

if (e?.response) {
    const data = e.response.data ?? {};

    const fieldErrors: Record<string, string> = {};
    if (data.errors && typeof data.errors === 'object') {
    Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
    });
    }

    return {
    success: false,
    message:
        typeof data.message === 'string' && data.message.length > 0
        ? data.message
        : fallback,
    data: null,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
}

if (e?.request) {
    return {
    success: false,
    message: 'No internet connection.',
    data: null,
    fieldErrors: null,
    };
}

return {
    success: false,
    message: fallback,
    data: null,
    fieldErrors: null,
};
};

// ============================================================
// SERVICE
// ============================================================

class WebApiService {
/**
 * GET /api/v1/public/faqs/list
 */
async list(): Promise<WebFaqListResponse> {
    try {
    const res = await axiosClient.get(API_ADMIN_FAQS_PUBLIC_LIST);

    const raw = res.data?.data;
    const faqs: WebFaq[] = Array.isArray(raw) ? raw : (raw?.faqs ?? []);

    return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: faqs,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to load FAQs.');
    return { success: false, message: e.message, data: null };
    }
}

/**
 * POST /api/v1/public/help-enquiries/store (public — no auth)
 */
async helpEnquirySendEnquiry(payload: HelpEnquiryPayload): Promise<WebEnquiryResponse> {
    try {
    const res = await axiosClient.post(API_PUBLIC_HELP_ENQUIRIES_CREATE, {
        name: payload.name,
        email: payload.email,
        question: payload.question,
        status: 'active',
    });

    return {
        success: true,
        message: res.data?.message ?? 'Enquiry sent.',
        data: res.data?.data ?? null,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to send enquiry.');
    return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
    };
    }
}

/**
 * POST /api/v1/public/enquiries/store (public — no auth)
 */
async businessSendEnquiry(
    payload: BusinessEnquiryPayload
): Promise<WebEnquiryResponse> {
    try {
    const res = await axiosClient.post(API_ADMIN_ENQUIRIES_CREATE, {
        name: payload.name,
        email: payload.email,
        contact: payload.contact ?? null,
        location: payload.location ?? null,
        description: payload.description,
        status: 'active',
    });

    return {
        success: true,
        message: res.data?.message ?? 'Enquiry sent.',
        data: res.data?.data ?? null,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to send enquiry.');
    return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
    };
    }
}

/**
 * GET /api/v1/public/services/list
 */
async listServices(): Promise<ServicesListResponse> {
    try {
    const res = await axiosClient.get(API_PUBLIC_SERVICES_LIST);
    const items = res.data?.data?.items ?? res.data?.data ?? [];
    return {
        success: true,
        message: res.data?.message ?? 'Services loaded successfully.',
        data: items,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to load services.');
    return { success: false, message: e.message, data: null };
    }
}
}

export const webApiService = new WebApiService();
export default webApiService;
// src/apiServices/enquiryService.ts

import axiosClient from './axiosClient';
import {
API_ADMIN_ENQUIRIES_LIST,
API_ADMIN_ENQUIRIES_SHOW,
API_ADMIN_ENQUIRIES_CREATE,
API_ADMIN_ENQUIRIES_UPDATE,
API_ADMIN_ENQUIRIES_DELETE,
} from './APIs';

export type EnquiryStatus = 'active' | 'inactive' | 'archived';

export interface Enquiry {
id: string;
name: string;
email: string;
contact: string | null;
location: string | null;
description: string | null;
status: EnquiryStatus;
created_at: string;
updated_at: string;
}

export interface EnquiryPayload {
name: string;
email: string;
contact?: string | null;
location?: string | null;
description?: string | null;
status?: EnquiryStatus;
}

interface ApiListResponse {
success: boolean;
message: string;
data: Enquiry[] | null;
}

interface ApiSingleResponse {
success: boolean;
message: string;
data: Enquiry | null;
fieldErrors?: Record<string, string> | null;
}

const handleError = (
error: unknown,
fallback: string
): {
success: false;
message: string;
data: null;
fieldErrors: Record<string, string> | null;
} => {
const e = error as {
    response?: {
    status?: number;
    data?: { message?: string; errors?: Record<string, string[]> };
    };
    request?: unknown;
};

if (e?.response) {
    const data = e.response.data ?? {};

    // Flatten Laravel-style { field: [msg] } → { field: msg }
    const fieldErrors: Record<string, string> = {};
    if (data.errors && typeof data.errors === 'object') {
    Object.entries(data.errors).forEach(([field, msgs]) => {
        fieldErrors[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
    });
    }

    return {
    success: false,
    message:
        typeof data.message === 'string' && data.message.length > 0
        ? data.message
        : fallback,
    data: null,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : null,
    };
}

if (e?.request) {
    return {
    success: false,
    message: 'No internet connection.',
    data: null,
    fieldErrors: null,
    };
}

return {
    success: false,
    message: fallback,
    data: null,
    fieldErrors: null,
};
};

class EnquiryService {
// GET /api/v1/auth/admin/enquiries/list
async list(): Promise<ApiListResponse> {
    try {
    const res = await axiosClient.get(API_ADMIN_ENQUIRIES_LIST);
    return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data?.items ?? [],
    };
    } catch (error) {
    const e = handleError(error, 'Failed to load enquiries.');
    return { success: false, message: e.message, data: null };
    }
}

// GET /api/v1/auth/admin/enquiries/show/{id}
async show(id: string): Promise<ApiSingleResponse> {
    try {
    const res = await axiosClient.get(API_ADMIN_ENQUIRIES_SHOW(id));
    return {
        success: true,
        message: res.data?.message ?? 'Loaded.',
        data: res.data?.data ?? null,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to load enquiry.');
    return { success: false, message: e.message, data: null };
    }
}

// POST /api/v1/public/enquiries/store  (public — no auth)
async create(payload: EnquiryPayload): Promise<ApiSingleResponse> {
    try {
    const res = await axiosClient.post(API_ADMIN_ENQUIRIES_CREATE, {
        name: payload.name,
        email: payload.email,
        contact: payload.contact ?? null,
        location: payload.location ?? null,
        description: payload.description ?? null,
        status: payload.status ?? 'active',
    });
    return {
        success: true,
        message: res.data?.message ?? 'Created.',
        data: res.data?.data ?? null,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to create enquiry.');
    return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
    };
    }
}

// POST /api/v1/auth/admin/enquiries/update
// Body must include: updateId
async update(id: string, payload: EnquiryPayload): Promise<ApiSingleResponse> {
    try {
    const res = await axiosClient.post(API_ADMIN_ENQUIRIES_UPDATE, {
        updateId: id,
        name: payload.name,
        email: payload.email,
        contact: payload.contact ?? null,
        location: payload.location ?? null,
        description: payload.description ?? null,
        status: payload.status ?? 'active',
    });
    return {
        success: true,
        message: res.data?.message ?? 'Updated.',
        data: res.data?.data ?? null,
    };
    } catch (error) {
    const e = handleError(error, 'Failed to update enquiry.');
    return {
        success: false,
        message: e.message,
        data: null,
        fieldErrors: e.fieldErrors,
    };
    }
}

// DELETE /api/v1/auth/admin/enquiries/delete
// Body must include: deleteId
async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
    const res = await axiosClient.delete(API_ADMIN_ENQUIRIES_DELETE, {
        data: { deleteId: id },
    });
    return { success: true, message: res.data?.message ?? 'Deleted.' };
    } catch (error) {
    const e = handleError(error, 'Failed to delete enquiry.');
    return { success: false, message: e.message };
    }
}
}

export const enquiryService = new EnquiryService();
export default enquiryService;

1- create a layeredd monolith for the SystemUser to be like the above stracture 
2- create the README.md documetation like above 
3- create the Apis defination for typscript
4- create a applicationService.ts for ADMIN service file like given above 
5- integrate the posints of data
6- save the doccs and attachmentes to the laravel public/application dir 
7- database tables 
    Name,email,password,role [Super Admin, Finance Admin, Membership Admin]
8- implement the log in method for the user and log out with JWT

