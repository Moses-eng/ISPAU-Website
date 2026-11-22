<?php

namespace App\Modules\Dispute\Repositories;

use App\Modules\Dispute\Models\DisputeModel;
use App\Modules\Dispute\RepositoryInterfaces\DisputeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DisputeRepository implements DisputeRepositoryInterface
{
    public function __construct(private readonly DisputeModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across name / email / reason / recordId ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name',     'like', "%{$search}%")
                  ->orWhere('email',  'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhere('recordId', 'like', "%{$search}%");
            });
        }

        // ---- Filter by status ----
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // ---- Filter by recordId (exact) ----
        if (! empty($filters['recordId'])) {
            $query->where('recordId', $filters['recordId']);
        }

        // ---- Filter by email ----
        if (! empty($filters['email'])) {
            $query->where('email', 'like', "%{$filters['email']}%");
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?DisputeModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): DisputeModel
    {
        return $this->model->create($data);
    }

    public function update(DisputeModel $dispute, array $data): DisputeModel
    {
        $dispute->update($data);
        return $dispute->fresh();
    }

    public function delete(DisputeModel $dispute): bool
    {
        return (bool) $dispute->delete();
    }
}
