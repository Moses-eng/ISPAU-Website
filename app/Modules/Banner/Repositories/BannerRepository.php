<?php

namespace App\Modules\Banner\Repositories;

use App\Modules\Banner\Models\BannerModel;
use App\Modules\Banner\RepositoryInterfaces\BannerRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BannerRepository implements BannerRepositoryInterface
{
    public function __construct(private readonly BannerModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name',        'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('page_name',   'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['page_name'])) {
            $query->where('page_name', strtolower(trim((string) $filters['page_name'])));
        }

        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function allPublicActive(?string $pageName = null): Collection
    {
        $query = $this->model->newQuery()
            ->where('status', 'active');

        if ($pageName !== null && $pageName !== '') {
            $query->where('page_name', strtolower(trim($pageName)));
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    public function findById(string $id): ?BannerModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): BannerModel
    {
        return $this->model->create($data);
    }

    public function update(BannerModel $banner, array $data): BannerModel
    {
        $banner->update($data);
        return $banner->fresh();
    }

    public function delete(BannerModel $banner): bool
    {
        return (bool) $banner->delete();
    }
}
