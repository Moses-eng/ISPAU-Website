<?php

namespace App\Modules\Blog\Services;

use App\Modules\Blog\DTOs\BlogActionResponseData;
use App\Modules\Blog\DTOs\BlogRequestData;
use App\Modules\Blog\DTOs\BlogResponseData;
use App\Modules\Blog\Interfaces\BlogServiceInterface;
use App\Modules\Blog\Models\BlogArticleModel;
use App\Modules\Blog\RepositoryInterfaces\BlogRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BlogService implements BlogServiceInterface
{
    public function __construct(
        private readonly BlogRepositoryInterface $repository,
        private readonly BlogAttachmentService   $attachments,
    ) {}

    // ==================== ADMIN LIST ====================

    public function listAll(array $filters = []): BlogActionResponseData
    {
        try {
            $articles = $this->repository->all($filters);

            $items = $articles
                ->map(fn (BlogArticleModel $a) => BlogResponseData::fromModel($a)->toArray())
                ->values()
                ->all();

            return BlogActionResponseData::success(
                message: 'Articles fetched successfully.',
                article: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Blog list failed', ['error' => $e->getMessage(), 'filters' => $filters]);
            return BlogActionResponseData::error('Failed to fetch articles.');
        }
    }

    // ==================== PUBLIC LIST ====================

    public function listPublic(array $filters = []): BlogActionResponseData
    {
        try {
            $articles = $this->repository->allPublicPublished($filters);

            $items = $articles
                ->map(fn (BlogArticleModel $a) => BlogResponseData::fromModel($a)->toArray())
                ->values()
                ->all();

            return BlogActionResponseData::success(
                message: 'Articles fetched successfully.',
                article: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Public blog list failed', ['error' => $e->getMessage()]);
            return BlogActionResponseData::error('Failed to fetch articles.');
        }
    }

    // ==================== PUBLIC SHOW (by slug) ====================

    public function showBySlug(string $slug): BlogActionResponseData
    {
        $article = $this->repository->findBySlug($slug);
        if (! $article || ! $article->isPublished()) {
            return BlogActionResponseData::error('Article not found.');
        }

        return BlogActionResponseData::success(
            message: 'Article fetched successfully.',
            article: BlogResponseData::fromModel($article),
        );
    }

    // ==================== ADMIN SHOW ====================

    public function show(string $id): BlogActionResponseData
    {
        $article = $this->repository->findById($id);
        if (! $article) {
            return BlogActionResponseData::error('Article not found.');
        }

        return BlogActionResponseData::success(
            message: 'Article fetched successfully.',
            article: BlogResponseData::fromModel($article),
        );
    }

    // ==================== CREATE ====================

    public function create(BlogRequestData $data, ?UploadedFile $image = null): BlogActionResponseData
    {
        try {
            return DB::transaction(function () use ($data, $image) {
                $status = in_array($data->status, ['draft', 'published', 'archived']) ? $data->status : 'draft';
                $publishedAt = ($status === 'published') ? now() : null;

                $article = $this->repository->create([
                    ...$data->toArray(),
                    'image'        => '',
                    'status'       => $status,
                    'published_at' => $publishedAt,
                ]);

                if ($image) {
                    $relativePath = $this->attachments->store($article->id, $image);
                    if (! $relativePath) {
                        throw new \RuntimeException('Image upload failed.');
                    }
                    $article = $this->repository->update($article, ['image' => $relativePath]);
                }

                Log::info('Blog article created', ['article_id' => $article->id, 'status' => $status]);

                return BlogActionResponseData::success(
                    message: "Article '{$article->title}' saved successfully.",
                    article: BlogResponseData::fromModel($article),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Blog create failed', ['error' => $e->getMessage()]);
            return BlogActionResponseData::error('Failed to save article: ' . $e->getMessage());
        }
    }

    // ==================== UPDATE ====================

    public function update(
        BlogArticleModel $article,
        BlogRequestData $data,
        ?UploadedFile $image = null,
    ): BlogActionResponseData {
        try {
            return DB::transaction(function () use ($article, $data, $image) {
                $payload = $data->toArray();

                // Update status and manage published_at timestamp
                if (! empty($data->status)) {
                    $payload['status'] = $data->status;
                    if ($data->status === 'published' && empty($article->published_at)) {
                        $payload['published_at'] = now();
                    }
                }

                if ($image) {
                    $relativePath = $this->attachments->store($article->id, $image);
                    if (! $relativePath) {
                        throw new \RuntimeException('Image upload failed.');
                    }
                    $payload['image'] = $relativePath;
                }

                $updated = $this->repository->update($article, $payload);

                return BlogActionResponseData::success(
                    message: 'Article updated successfully.',
                    article: BlogResponseData::fromModel($updated),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Blog update failed', [
                'article_id' => $article->id,
                'error'      => $e->getMessage(),
            ]);
            return BlogActionResponseData::error('Failed to update article: ' . $e->getMessage());
        }
    }

    // ==================== DELETE ====================

    public function delete(BlogArticleModel $article): BlogActionResponseData
    {
        try {
            return DB::transaction(function () use ($article) {
                $this->attachments->deleteDirectory($article->id);
                $this->repository->delete($article);

                Log::info('Blog article deleted', ['article_id' => $article->id]);

                return BlogActionResponseData::success(
                    message: 'Article deleted successfully.',
                    article: null,
                );
            });
        } catch (\Throwable $e) {
            Log::error('Blog delete failed', [
                'article_id' => $article->id,
                'error'      => $e->getMessage(),
            ]);
            return BlogActionResponseData::error('Failed to delete article.');
        }
    }
}
