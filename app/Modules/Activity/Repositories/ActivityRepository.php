<?php

namespace App\Modules\Activity\Repositories;

use App\Modules\Activity\Models\ActivityModel;
use App\Modules\Activity\RepositoryInterfaces\ActivityRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ActivityRepository implements ActivityRepositoryInterface
{
    public function __construct(private readonly ActivityModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title',       'like', "%{$search}%")
                  ->orWhere('author',    'like', "%{$search}%")
                  ->orWhere('organiser', 'like', "%{$search}%")
                  ->orWhere('location',  'like', "%{$search}%")
                  ->orWhere('category',  'like', "%{$search}%")
                  ->orWhere('summary',   'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['author'])) {
            $query->where('author', $filters['author']);
        }

        if (! empty($filters['organiser'])) {
            $query->where('organiser', $filters['organiser']);
        }

        $sort  = $filters['sort']  ?? 'updated_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?ActivityModel
    {
        return $this->model->find($id);
    }

    public function findBySlug(string $slug): ?ActivityModel
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function create(array $data): ActivityModel
    {
        return $this->model->create($data);
    }

    public function update(ActivityModel $activity, array $data): ActivityModel
    {
        $activity->update($data);
        return $activity->fresh();
    }

    public function delete(ActivityModel $activity): bool
    {
        return (bool) $activity->delete();
    }

    public function allPublicPublished(array $filters = []): Collection
    {
        $query = $this->model->newQuery()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title',       'like', "%{$search}%")
                  ->orWhere('organiser', 'like', "%{$search}%")
                  ->orWhere('location',  'like', "%{$search}%")
                  ->orWhere('summary',   'like', "%{$search}%");
            });
        }

        // Upcoming / Past timeline filters
        if (! empty($filters['timeline'])) {
            if ($filters['timeline'] === 'upcoming') {
                $query->where('starts_at', '>=', now())->orderBy('starts_at', 'asc');
            } elseif ($filters['timeline'] === 'past') {
                $query->where('ends_at', '<', now())->orderBy('ends_at', 'desc');
            }
        } else {
            $query->orderBy('starts_at', 'desc')->orderBy('published_at', 'desc');
        }

        if (! empty($filters['limit'])) {
            $query->limit((int) $filters['limit']);
        }

        return $query->get();
    }
}
