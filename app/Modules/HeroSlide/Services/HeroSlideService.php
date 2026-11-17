<?php

namespace App\Modules\HeroSlide\Services;

use App\Modules\HeroSlide\DTOs\HeroSlideActionResponseData;
use App\Modules\HeroSlide\DTOs\HeroSlideRequestData;
use App\Modules\HeroSlide\DTOs\HeroSlideResponseData;
use App\Modules\HeroSlide\Interfaces\HeroSlideServiceInterface;
use App\Modules\HeroSlide\Models\HeroSlideModel;
use App\Modules\HeroSlide\RepositoryInterfaces\HeroSlideRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HeroSlideService implements HeroSlideServiceInterface
{
    public function __construct(
        private readonly HeroSlideRepositoryInterface $repository,
        private readonly HeroSlideAttachmentService   $attachments,
    ) {}

    // ==================== ADMIN LIST ====================

    public function listAll(array $filters = []): HeroSlideActionResponseData
    {
        try {
            $slides = $this->repository->all($filters);

            $items = $slides
                ->map(fn (HeroSlideModel $s) => HeroSlideResponseData::fromModel($s)->toArray())
                ->values()
                ->all();

            return HeroSlideActionResponseData::success(
                message: 'Hero slides fetched successfully.',
                slide: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Hero slide list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return HeroSlideActionResponseData::error('Failed to fetch hero slides.');
        }
    }

    // ==================== PUBLIC LIST ====================

    public function listPublic(): HeroSlideActionResponseData
    {
        try {
            $slides = $this->repository->allPublicActive();

            $items = $slides
                ->map(fn (HeroSlideModel $s) => HeroSlideResponseData::fromModel($s)->toArray())
                ->values()
                ->all();

            return HeroSlideActionResponseData::success(
                message: 'Hero slides fetched successfully.',
                slide: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Public hero slide list failed', ['error' => $e->getMessage()]);
            return HeroSlideActionResponseData::error('Failed to fetch hero slides.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): HeroSlideActionResponseData
    {
        $slide = $this->repository->findById($id);
        if (! $slide) {
            return HeroSlideActionResponseData::error('Hero slide not found.');
        }

        return HeroSlideActionResponseData::success(
            message: 'Hero slide fetched successfully.',
            slide: HeroSlideResponseData::fromModel($slide),
        );
    }

    // ==================== CREATE ====================

    public function create(HeroSlideRequestData $data, UploadedFile $image): HeroSlideActionResponseData
    {
        try {
            return DB::transaction(function () use ($data, $image) {
                // 1) Persist text columns first so the row (and its UUID) exists.
                $slide = $this->repository->create([
                    ...$data->toArray(),
                    'src' => '', // placeholder, set after upload
                ]);

                // 2) Store the image into public/images/heroSlide/{slideId}/
                $relativePath = $this->attachments->store($slide->id, $image);
                if (! $relativePath) {
                    throw new \RuntimeException('Image upload failed.');
                }

                // 3) Update the row with the final path.
                $slide = $this->repository->update($slide, ['src' => $relativePath]);

                Log::info('Hero slide created', ['slide_id' => $slide->id]);

                return HeroSlideActionResponseData::success(
                    message: "Hero slide \"{$slide->caption}\" created successfully.",
                    slide: HeroSlideResponseData::fromModel($slide),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Hero slide creation failed', ['error' => $e->getMessage()]);
            return HeroSlideActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(
        HeroSlideModel $slide,
        HeroSlideRequestData $data,
        ?UploadedFile $image = null,
    ): HeroSlideActionResponseData {
        try {
            return DB::transaction(function () use ($slide, $data, $image) {
                $payload = $data->toArray();

                if ($image) {
                    $relativePath = $this->attachments->store($slide->id, $image);
                    if (! $relativePath) {
                        throw new \RuntimeException('Image upload failed.');
                    }
                    $payload['src'] = $relativePath;
                }

                $updated = $this->repository->update($slide, $payload);

                return HeroSlideActionResponseData::success(
                    message: 'Hero slide updated successfully.',
                    slide: HeroSlideResponseData::fromModel($updated),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Hero slide update failed', [
                'slide_id' => $slide->id,
                'error'    => $e->getMessage(),
            ]);
            return HeroSlideActionResponseData::error('Failed to update hero slide.');
        }
    }

    // ==================== DELETE ====================

    public function delete(HeroSlideModel $slide): HeroSlideActionResponseData
    {
        try {
            return DB::transaction(function () use ($slide) {
                // Remove the physical image folder first
                $this->attachments->deleteDirectory($slide->id);

                $this->repository->delete($slide);

                Log::info('Hero slide deleted', [
                    'slide_id' => $slide->id,
                    'caption'  => $slide->caption,
                ]);

                return HeroSlideActionResponseData::success(
                    message: 'Hero slide deleted successfully.',
                    slide: null,
                );
            });
        } catch (\Throwable $e) {
            Log::error('Hero slide delete failed', [
                'slide_id' => $slide->id,
                'error'    => $e->getMessage(),
            ]);
            return HeroSlideActionResponseData::error('Failed to delete hero slide.');
        }
    }
}
