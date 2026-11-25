<?php

namespace App\Modules\Activity\Services;

use App\Modules\Activity\DTOs\ActivityActionResponseData;
use App\Modules\Activity\DTOs\ActivityRequestData;
use App\Modules\Activity\DTOs\ActivityResponseData;
use App\Modules\Activity\Interfaces\ActivityServiceInterface;
use App\Modules\Activity\Models\ActivityModel;
use App\Modules\Activity\RepositoryInterfaces\ActivityRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityService implements ActivityServiceInterface
{
    public function __construct(
        private readonly ActivityRepositoryInterface $repository,
        private readonly ActivityAttachmentService   $attachments,
    ) {}

    // ==================== ADMIN LIST ====================

    public function listAll(array $filters = []): ActivityActionResponseData
    {
        try {
            $activities = $this->repository->all($filters);

            $items = $activities
                ->map(fn (ActivityModel $a) => ActivityResponseData::fromModel($a)->toArray())
                ->values()
                ->all();

            return ActivityActionResponseData::success(
                message: 'Activities fetched successfully.',
                activity: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Activity list failed', ['error' => $e->getMessage(), 'filters' => $filters]);
            return ActivityActionResponseData::error('Failed to fetch activities.');
        }
    }

    // ==================== PUBLIC LIST ====================

    public function listPublic(array $filters = []): ActivityActionResponseData
    {
        try {
            $activities = $this->repository->allPublicPublished($filters);

            $items = $activities
                ->map(fn (ActivityModel $a) => ActivityResponseData::fromModel($a)->toArray())
                ->values()
                ->all();

            return ActivityActionResponseData::success(
                message: 'Activities fetched successfully.',
                activity: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Public activity list failed', ['error' => $e->getMessage()]);
            return ActivityActionResponseData::error('Failed to fetch activities.');
        }
    }

    // ==================== PUBLIC SHOW ====================

    public function showBySlug(string $slug): ActivityActionResponseData
    {
        $activity = $this->repository->findBySlug($slug);
        if (! $activity || ! $activity->isPublished()) {
            return ActivityActionResponseData::error('Activity not found.');
        }

        return ActivityActionResponseData::success(
            message: 'Activity fetched successfully.',
            activity: ActivityResponseData::fromModel($activity),
        );
    }

    // ==================== ADMIN SHOW ====================

    public function show(string $id): ActivityActionResponseData
    {
        $activity = $this->repository->findById($id);
        if (! $activity) {
            return ActivityActionResponseData::error('Activity not found.');
        }

        return ActivityActionResponseData::success(
            message: 'Activity fetched successfully.',
            activity: ActivityResponseData::fromModel($activity),
        );
    }

    // ==================== CREATE ====================

    public function create(ActivityRequestData $data, ?UploadedFile $image = null): ActivityActionResponseData
    {
        try {
            return DB::transaction(function () use ($data, $image) {
                $status = in_array($data->status, ['draft', 'published', 'archived']) ? $data->status : 'draft';
                $publishedAt = ($status === 'published') ? now() : null;

                $activity = $this->repository->create([
                    ...$data->toArray(),
                    'image'        => '',
                    'status'       => $status,
                    'published_at' => $publishedAt,
                ]);

                if ($image) {
                    $relativePath = $this->attachments->store($activity->id, $image);
                    if (! $relativePath) {
                        throw new \RuntimeException('Image upload failed.');
                    }
                    $activity = $this->repository->update($activity, ['image' => $relativePath]);
                }

                Log::info('Activity created', ['activity_id' => $activity->id, 'status' => $status]);

                return ActivityActionResponseData::success(
                    message: "Activity '{$activity->title}' saved successfully.",
                    activity: ActivityResponseData::fromModel($activity),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Activity create failed', ['error' => $e->getMessage()]);
            return ActivityActionResponseData::error('Failed to save activity: ' . $e->getMessage());
        }
    }

    // ==================== UPDATE ====================

    public function update(
        ActivityModel $activity,
        ActivityRequestData $data,
        ?UploadedFile $image = null,
    ): ActivityActionResponseData {
        try {
            return DB::transaction(function () use ($activity, $data, $image) {
                $payload = $data->toArray();

                if (! empty($data->status)) {
                    $payload['status'] = $data->status;
                    if ($data->status === 'published' && empty($activity->published_at)) {
                        $payload['published_at'] = now();
                    }
                }

                if ($image) {
                    $relativePath = $this->attachments->store($activity->id, $image);
                    if (! $relativePath) {
                        throw new \RuntimeException('Image upload failed.');
                    }
                    $payload['image'] = $relativePath;
                }

                $updated = $this->repository->update($activity, $payload);

                return ActivityActionResponseData::success(
                    message: 'Activity updated successfully.',
                    activity: ActivityResponseData::fromModel($updated),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Activity update failed', [
                'activity_id' => $activity->id,
                'error'       => $e->getMessage(),
            ]);
            return ActivityActionResponseData::error('Failed to update activity: ' . $e->getMessage());
        }
    }

    // ==================== DELETE ====================

    public function delete(ActivityModel $activity): ActivityActionResponseData
    {
        try {
            return DB::transaction(function () use ($activity) {
                $this->attachments->deleteDirectory($activity->id);
                $this->repository->delete($activity);

                Log::info('Activity deleted', ['activity_id' => $activity->id]);

                return ActivityActionResponseData::success(
                    message: 'Activity deleted successfully.',
                    activity: null,
                );
            });
        } catch (\Throwable $e) {
            Log::error('Activity delete failed', [
                'activity_id' => $activity->id,
                'error'       => $e->getMessage(),
            ]);
            return ActivityActionResponseData::error('Failed to delete activity.');
        }
    }
}
