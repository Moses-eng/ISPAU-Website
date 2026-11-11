<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\DTOs\ClarificationActionResponseData;
use App\Modules\Application\DTOs\ClarificationRequestData;
use App\Modules\Application\DTOs\ClarificationResponseData;
use App\Modules\Application\Interfaces\ClarificationServiceInterface;
use App\Modules\Application\Models\ClarificationModel;
use App\Modules\Application\RepositoryInterfaces\ClarificationRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClarificationService implements ClarificationServiceInterface
{
    public function __construct(
        private readonly ClarificationRepositoryInterface $repository,
    ) {}

    public function listByApplication(string $applicationId): ClarificationActionResponseData
    {
        try {
            $rows = $this->repository->findByApplication($applicationId)
                ->map(fn (ClarificationModel $c) => ClarificationResponseData::fromModel($c)->toArray())
                ->values()
                ->all();

            return ClarificationActionResponseData::success(
                message: 'Clarifications fetched successfully.',
                clarification: null,
                payload: ['items' => $rows, 'total' => count($rows)],
            );
        } catch (\Throwable $e) {
            Log::error('Clarification list failed', [
                'application_id' => $applicationId,
                'error'          => $e->getMessage(),
            ]);
            return ClarificationActionResponseData::error('Failed to fetch clarifications.');
        }
    }

    public function raise(ClarificationRequestData $data): ClarificationActionResponseData
    {
        try {
            return DB::transaction(function () use ($data) {
                $app = ApplicationModel::find($data->applicationId);
                if (! $app) {
                    return ClarificationActionResponseData::error('Application not found.');
                }

                // Avoid stacking multiple unresolved requests on the same application
                if ($this->repository->hasOpen($data->applicationId)) {
                    return ClarificationActionResponseData::error(
                        'An open clarification request already exists for this application.'
                    );
                }

                $clarification = $this->repository->create($data->toCreateArray());

                // Move application into "Clarification needed" if it isn't already
                if (in_array($app->status, ['Submitted', 'Under review'], true)) {
                    $app->update(['status' => 'Clarification needed']);
                }

                Log::info('Clarification raised', [
                    'application_id'  => $data->applicationId,
                    'clarification_id'=> $clarification->id,
                    'reviewer_id'     => $data->reviewerId,
                    'raised_by'       => $data->assignedBy,
                ]);

                return ClarificationActionResponseData::success(
                    message: "Clarification request sent to {$app->legal_name}.",
                    clarification: ClarificationResponseData::fromModel($clarification),
                );
            });
        } catch (\Throwable $e) {
            Log::error('Clarification raise failed', [
                'application_id' => $data->applicationId,
                'error'          => $e->getMessage(),
            ]);
            return ClarificationActionResponseData::error('Failed to raise clarification: ' . $e->getMessage());
        }
    }

    public function respond(ClarificationModel $clarification, string $response, string $status = 'Responded'): ClarificationActionResponseData
    {
        try {
            $updated = $this->repository->update($clarification, [
                'response'     => $response,
                'responded_at' => now(),
                'status'       => $status,
            ]);

            // Bring the application back into review
            $app = ApplicationModel::find($updated->application_id);
            if ($app && $app->status === 'Clarification needed') {
                $app->update(['status' => 'Under review']);
            }

            return ClarificationActionResponseData::success(
                message: 'Clarification response recorded.',
                clarification: ClarificationResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Clarification respond failed', [
                'clarification_id' => $clarification->id,
                'error'            => $e->getMessage(),
            ]);
            return ClarificationActionResponseData::error('Failed to save clarification response.');
        }
    }

    public function close(ClarificationModel $clarification, string $status = 'Closed'): ClarificationActionResponseData
    {
        try {
            $updated = $this->repository->update($clarification, ['status' => $status]);

            return ClarificationActionResponseData::success(
                message: 'Clarification closed.',
                clarification: ClarificationResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Clarification close failed', [
                'clarification_id' => $clarification->id,
                'error'            => $e->getMessage(),
            ]);
            return ClarificationActionResponseData::error('Failed to close clarification.');
        }
    }
}
