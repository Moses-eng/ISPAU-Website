<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\DTOs\VerificationActionResponseData;
use App\Modules\Application\DTOs\VerificationRequestData;
use App\Modules\Application\DTOs\VerificationResponseData;
use App\Modules\Application\Interfaces\VerificationServiceInterface;
use App\Modules\Application\Models\VerificationModel;
use App\Modules\Application\RepositoryInterfaces\VerificationRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VerificationService implements VerificationServiceInterface
{
    public function __construct(
        private readonly VerificationRepositoryInterface $repository,
    ) {}

    public function listByApplication(string $applicationId): VerificationActionResponseData
    {
        try {
            $rows = $this->repository->findByApplication($applicationId)
                ->map(fn (VerificationModel $v) => VerificationResponseData::fromModel($v)->toArray())
                ->values()
                ->all();

            return VerificationActionResponseData::success(
                message: 'Verifications fetched successfully.',
                verification: null,
                payload: ['items' => $rows, 'total' => count($rows)],
            );
        } catch (\Throwable $e) {
            Log::error('Verification list failed', [
                'application_id' => $applicationId,
                'error'          => $e->getMessage(),
            ]);
            return VerificationActionResponseData::error('Failed to fetch verifications.');
        }
    }

    public function record(VerificationRequestData $data): VerificationActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $app = ApplicationModel::find($data->applicationId);
                if (! $app) {
                    return VerificationActionResponseData::error('Application not found.');
                }

                // A verification is immutable, but we keep a trail: any previous
                // "Recorded" verification for this application becomes "Superseded".
                $this->repository->markSuperseded($data->applicationId);

                $verification = $this->repository->create($data->toCreateArray());

                // Surface any "Clarification needed" outcomes on the application status
                $needsClarification = in_array('Clarification needed', [
                    $data->registrationResult,
                    $data->authorityResult,
                    $data->regulatoryResult,
                ], true);

                if ($needsClarification && in_array($app->status, ['Submitted', 'Under review'], true)) {
                    $app->update(['status' => 'Clarification needed']);
                }

                Log::info('Verification recorded', [
                    'application_id'  => $data->applicationId,
                    'verification_id' => $verification->id,
                    'reviewer_id'     => $data->reviewerId,
                    'needs_clarif'    => $needsClarification,
                ]);

                return VerificationActionResponseData::success(
                    message: 'Record verification saved.',
                    verification: VerificationResponseData::fromModel($verification),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Verification record failed', [
                'application_id' => $data->applicationId,
                'error'          => $e->getMessage(),
            ]);
            return VerificationActionResponseData::error(
                'Failed to save verification: ' . $e->getMessage()
            );
        }
    }
}
