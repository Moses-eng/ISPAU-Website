<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\DTOs\ReviewerActionResponseData;
use App\Modules\Application\DTOs\ReviewerRequestData;
use App\Modules\Application\DTOs\ReviewerResponseData;
use App\Modules\Application\Interfaces\ReviewerServiceInterface;
use App\Modules\Application\Models\ReviewerModel;
use App\Modules\Application\RepositoryInterfaces\ReviewerRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReviewerService implements ReviewerServiceInterface
{
    public function __construct(
        private readonly ReviewerRepositoryInterface $repository,
    ) {}

    public function listByApplication(string $applicationId): ReviewerActionResponseData
    {
        try {
            $rows = $this->repository->findByApplication($applicationId)
                ->map(fn (ReviewerModel $r) => ReviewerResponseData::fromModel($r)->toArray())
                ->values()
                ->all();

            return ReviewerActionResponseData::success(
                message: 'Reviewers fetched successfully.',
                reviewer: null,
                payload: ['items' => $rows, 'total' => count($rows)],
            );
        } catch (\Throwable $e) {
            Log::error('Reviewer list failed', [
                'application_id' => $applicationId,
                'error'          => $e->getMessage(),
            ]);
            return ReviewerActionResponseData::error('Failed to fetch reviewers.');
        }
    }

    public function assign(ReviewerRequestData $data): ReviewerActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                // Application must exist
                $app = ApplicationModel::find($data->applicationId);
                if (! $app) {
                    return ReviewerActionResponseData::error('Application not found.');
                }

                // Prevent duplicates
                if ($this->repository->existsFor($data->applicationId, $data->reviewerId)) {
                    return ReviewerActionResponseData::error(
                        'This reviewer is already assigned to this application.'
                    );
                }

                $reviewer = $this->repository->create($data->toArray());

                // Bump application into review if still Submitted
                if ($app->status === 'Submitted') {
                    $app->update(['status' => 'Under review']);
                }

                Log::info('Reviewer assigned', [
                    'application_id' => $data->applicationId,
                    'reviewer_id'    => $data->reviewerId,
                    'assigned_by'    => $data->assignedBy,
                ]);

                return ReviewerActionResponseData::success(
                    message: "Reviewer {$data->reviewerName} assigned successfully.",
                    reviewer: ReviewerResponseData::fromModel($reviewer),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Reviewer assignment failed', [
                'application_id' => $data->applicationId,
                'error'          => $e->getMessage(),
            ]);
            return ReviewerActionResponseData::error('Failed to assign reviewer: ' . $e->getMessage());
        }
    }

    public function withdraw(ReviewerModel $reviewer): ReviewerActionResponseData
    {
        try {
            $updated = $this->repository->update($reviewer, [
                'status'       => 'Withdrawn',
                'completed_at' => now(),
            ]);

            return ReviewerActionResponseData::success(
                message: 'Reviewer assignment withdrawn.',
                reviewer: ReviewerResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Reviewer withdraw failed', [
                'reviewer_id' => $reviewer->id,
                'error'       => $e->getMessage(),
            ]);
            return ReviewerActionResponseData::error('Failed to withdraw reviewer.');
        }
    }
}
