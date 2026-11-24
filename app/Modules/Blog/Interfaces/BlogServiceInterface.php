<?php

namespace App\Modules\Blog\Interfaces;

use App\Modules\Blog\DTOs\BlogActionResponseData;
use App\Modules\Blog\DTOs\BlogRequestData;
use App\Modules\Blog\Models\BlogArticleModel;

interface BlogServiceInterface
{
    public function listAll(array $filters = []): BlogActionResponseData;
    public function show(string $id): BlogActionResponseData;
    public function create(BlogRequestData $data): BlogActionResponseData;
    public function update(BlogArticleModel $article, BlogRequestData $data): BlogActionResponseData;
    public function delete(BlogArticleModel $article): BlogActionResponseData;
    public function listPublic(array $filters = []): BlogActionResponseData;
    public function showBySlug(string $slug): BlogActionResponseData;
}

