<?php

namespace App\Modules\Banner\Services;

use App\Modules\Banner\DTOs\BannerActionResponseData;
use App\Modules\Banner\DTOs\BannerRequestData;
use App\Modules\Banner\DTOs\BannerResponseData;
use App\Modules\Banner\Interfaces\BannerServiceInterface;
use App\Modules\Banner\Models\BannerModel;
use App\Modules\Banner\RepositoryInterfaces\BannerRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BannerService implements BannerServiceInterface
{
    public function __construct(
        private readonly BannerRepositoryInterface $repository,
        private readonly BannerAttachmentService   $attachments,
    ) {}

    // ==================== ADMIN LIST ====================

    public function listAll(array $filters = []): BannerActionResponseData
    {
        try {
            $banners = $this->repository->all($filters);

            $items = $banners
                ->map(fn (BannerModel $b) => BannerResponseData::fromModel($b)->toArray())
                ->values()
                ->all();

            return BannerActionResponseData::success(
                message: 'Banners fetched successfully.',
                banner: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Banner list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return BannerActionResponseData::error('Failed to fetch banners.');
        }
    }

    // ==================== PUBLIC LIST ====================

    public function listPublic(?string $pageName = null): BannerActionResponseData
    {
        try {
            $banners = $this->repository->allPublicActive($pageName);

            $items = $banners
                ->map(fn (BannerModel $b) => BannerResponseData::fromModel($b)->toArray())
                ->values()
                ->all();

            return BannerActionResponseData::success(
                message: 'Banners fetched successfully.',
                banner: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Public banner list failed', ['error' => $e->getMessage()]);
            return BannerActionResponseData::error('Failed to fetch banners.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): BannerActionResponseData
    {
        $banner = $this->repository->findById($id);
        if (! $banner) {
            return BannerActionResponseData::error('Banner not found.');
        }

        return BannerActionResponseData::success(
            message: 'Banner fetched successfully.',
            banner: BannerResponseData::fromModel($banner),
        );
    }

    // ==================== CREATE ====================

    public function create(BannerRequestData $data, UploadedFile $image): BannerActionResponseData
    {
        try {
            return DB::transaction(function () use ($data, $image) {
                // 1) Persist text columns first so the row (and its UUID) exists.
                $banner = $this->repository->create([
                    ...$data->toArray(),
                    'image' => '', // placeholder, set after upload
                ]);

                // 2) Store the image into public/images/Banner/{bannerId}/
                $relativePath = $this->attachments->store($banner->id, $image);
                if (! $relativePath) {
                    throw new \RuntimeException('Image upload failed.');
                }

                // 3) Update the row with the final path.
                $banner = $this->repository->update($banner, ['image' => $relativePath]);

                Log::info('Banner created', ['banner_id' => $banner->id]);

                return BannerActionResponseData::success(
                    message: "Banner \"{$banner->name}\" created successfully.",
                    banner: BannerResponseData::fromModel($banner),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Banner creation failed', ['error' => $e->getMessage()]);
            return BannerActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(
        BannerModel $banner,
        BannerRequestData $data,
        ?UploadedFile $image = null,
    ): BannerActionResponseData {
        try {
            return DB::transaction(function () use ($banner, $data, $image) {
                $payload = $data->toArray();

                if ($image) {
                    $relativePath = $this->attachments->store($banner->id, $image);
                    if (! $relativePath) {
                        throw new \RuntimeException('Image upload failed.');
                    }
                    $payload['image'] = $relativePath;
                }

                $updated = $this->repository->update($banner, $payload);

                return BannerActionResponseData::success(
                    message: 'Banner updated successfully.',
                    banner: BannerResponseData::fromModel($updated),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Banner update failed', [
                'banner_id' => $banner->id,
                'error'     => $e->getMessage(),
            ]);
            return BannerActionResponseData::error('Failed to update banner.');
        }
    }

    // ==================== DELETE ====================

    public function delete(BannerModel $banner): BannerActionResponseData
    {
        try {
            return DB::transaction(function () use ($banner) {
                $this->attachments->deleteDirectory($banner->id);
                $this->repository->delete($banner);

                Log::info('Banner deleted', [
                    'banner_id' => $banner->id,
                    'name'      => $banner->name,
                ]);

                return BannerActionResponseData::success(
                    message: 'Banner deleted successfully.',
                    banner: null,
                );
            });
        } catch (\Throwable $e) {
            Log::error('Banner delete failed', [
                'banner_id' => $banner->id,
                'error'     => $e->getMessage(),
            ]);
            return BannerActionResponseData::error('Failed to delete banner.');
        }
    }
}
