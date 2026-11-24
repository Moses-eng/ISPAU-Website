<?php

namespace App\Modules\Blog\Repositories;

use App\Modules\Blog\Models\BlogArticleModel;
use App\Modules\Blog\RepositoryInterfaces\BlogRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BlogRepository implements BlogRepositoryInterface
{
    public function __construct(private readonly BlogArticleModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('title',    'like', "%{$search}%")
                  ->orWhere('author',  'like', "%{$search}%")
                  ->orWhere('category','like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%");
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

        $sort  = $filters['sort']  ?? 'updated_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function findById(string $id): ?BlogArticleModel
    {
        return $this->model->find($id);
    }

    public function findBySlug(string $slug): ?BlogArticleModel
    {
        return $this->model->where('slug', $slug)->first();
    }

    public function create(array $data): BlogArticleModel
    {
        return $this->model->create($data);
    }

    public function update(BlogArticleModel $article, array $data): BlogArticleModel
    {
        $article->update($data);
        return $article->fresh();
    }

    public function delete(BlogArticleModel $article): bool
    {
        return (bool) $article->delete();
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
                $q->where('title',   'like', "%{$search}%")
                ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        // Public listing order: newest published first
        $query->orderBy('published_at', 'desc');

        if (! empty($filters['limit'])) {
            $query->limit((int) $filters['limit']);
        }

        return $query->get();
    }
}
