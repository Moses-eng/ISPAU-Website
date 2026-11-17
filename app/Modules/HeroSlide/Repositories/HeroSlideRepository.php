<?php

namespace App\Modules\HeroSlide\Repositories;

use App\Modules\HeroSlide\Models\HeroSlideModel;
use App\Modules\HeroSlide\RepositoryInterfaces\HeroSlideRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class HeroSlideRepository implements HeroSlideRepositoryInterface
{
    public function __construct(private readonly HeroSlideModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('caption',    'like', "%{$search}%")
                  ->orWhere('credit',     'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sort  = $filters['sort']  ?? 'sort_order';
        $order = $filters['order'] ?? 'asc';
        $query->orderBy($sort, $order)->orderBy('created_at', 'asc');

        return $query->get();
    }

    public function allPublicActive(): Collection
    {
        return $this->model
            ->newQuery()
            ->where('status', 'active')
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();
    }

    public function findById(string $id): ?HeroSlideModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): HeroSlideModel
    {
        return $this->model->create($data);
    }

    public function update(HeroSlideModel $slide, array $data): HeroSlideModel
    {
        $slide->update($data);
        return $slide->fresh();
    }

    public function delete(HeroSlideModel $slide): bool
    {
        return (bool) $slide->delete();
    }
}
