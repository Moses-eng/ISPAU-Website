<?php

namespace App\Modules\Application\Repositories;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\RepositoryInterfaces\ApplicationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ApplicationRepository implements ApplicationRepositoryInterface
{
    public function __construct(private readonly ApplicationModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // By default, hide unsubmitted drafts from admin queue unless explicitly asked
        if (empty($filters['include_drafts']) && empty($filters['status'])) {
            $query->where('status', '!=', 'Draft');
        }

        // Search: organisation name, trading name, UUID, reference, email
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('legal_name',              'like', "%{$search}%")
                  ->orWhere('trading_name',          'like', "%{$search}%")
                  ->orWhere('id',                    'like', "%{$search}%")
                  ->orWhere('registration_reference','like', "%{$search}%")
                  ->orWhere('business_email',        'like', "%{$search}%")
                  ->orWhere('applicant_name',        'like', "%{$search}%")
                  ->orWhere('applicant_email',       'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['requested_tier'])) {
            $query->where('requested_tier', $filters['requested_tier']);
        }

        if (! empty($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?ApplicationModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): ApplicationModel
    {
        return $this->model->create($data);
    }

    public function update(ApplicationModel $application, array $data): ApplicationModel
    {
        $application->update($data);
        return $application->fresh();
    }

    public function delete(ApplicationModel $application): bool
    {
        return (bool) $application->delete();
    }
}
