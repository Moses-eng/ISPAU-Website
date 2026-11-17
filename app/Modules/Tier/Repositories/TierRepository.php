<?php

namespace App\Modules\Tier\Repositories;

use App\Modules\Tier\Models\TierModel;
use App\Modules\Tier\RepositoryInterfaces\TierRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class TierRepository implements TierRepositoryInterface
{
    public function __construct(private readonly TierModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across name / description ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name',        'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // ---- Filter by status ----
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // ---- Cost range filters ----
        if (isset($filters['min_cost']) && $filters['min_cost'] !== '') {
            $query->where('cost', '>=', (float) $filters['min_cost']);
        }
        if (isset($filters['max_cost']) && $filters['max_cost'] !== '') {
            $query->where('cost', '<=', (float) $filters['max_cost']);
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?TierModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): TierModel
    {
        return $this->model->create($data);
    }

    public function update(TierModel $tier, array $data): TierModel
    {
        $tier->update($data);
        return $tier->fresh();
    }

    public function delete(TierModel $tier): bool
    {
        return (bool) $tier->delete();
    }

    public function allPublicActive(): Collection
    {
        return $this->model
            ->newQuery()
            ->where('status', 'active')
            ->orderBy('cost', 'asc')     // cheap → expensive feels natural on a site
            ->get();
    }
}
