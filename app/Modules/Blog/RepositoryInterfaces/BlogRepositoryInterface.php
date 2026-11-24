<?php

namespace App\Modules\Blog\RepositoryInterfaces;

use App\Modules\Blog\Models\BlogArticleModel;
use Illuminate\Database\Eloquent\Collection;

interface BlogRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?BlogArticleModel;
    public function findBySlug(string $slug): ?BlogArticleModel;
    public function create(array $data): BlogArticleModel;
    public function update(BlogArticleModel $article, array $data): BlogArticleModel;
    public function delete(BlogArticleModel $article): bool;
    public function allPublicPublished(array $filters = []): Collection;
}
