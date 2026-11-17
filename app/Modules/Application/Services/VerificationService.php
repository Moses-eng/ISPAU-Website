<?php

namespace App\Modules\Application\Services;

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
                $verification = $this->repository->create($data->toCreateArray());

                Log::info('Verification recorded', [
                    'application_id'  => $data->applicationId,
                    'verification_id' => $verification->id,
                    'reviewer_id'     => $data->reviewerId,
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
