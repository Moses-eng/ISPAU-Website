<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\DTOs\ApplicationActionResponseData;
use App\Modules\Application\DTOs\ApplicationRequestData;
use App\Modules\Application\DTOs\ApplicationResponseData;
use App\Modules\Application\Interfaces\ApplicationServiceInterface;
use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Support\Facades\Log;

class ApplicantProfileService
{
    public function __construct(
        private readonly ApplicationServiceInterface $applications,
    ) {}

    /**
     * Fetch a single applicant record by id.
     * Callers must pass the authenticated application so ownership is enforced.
     */
    public function show(ApplicationModel $authenticated, string $id): ApplicationActionResponseData
    {
        if ($authenticated->id !== $id) {
            return ApplicationActionResponseData::error(
                'You can only view your own application record.'
            );
        }

        $application = ApplicationModel::with(['reviewers', 'clarifications', 'verifications'])
            ->find($id);

        if (! $application) {
            return ApplicationActionResponseData::error('Application not found.');
        }

        return ApplicationActionResponseData::success(
            message: 'Application fetched successfully.',
            application: ApplicationResponseData::fromModel($application),
        );
    }

    /**
     * Update the authenticated applicant's own record.
     * Only whitelisted, user-editable fields can be changed — status, OTP
     * columns, password, and reviewer-managed relations are stripped out
     * by ApplicationRequestData's fromRequest() and ApplicationRule::updateRules().
     */
    public function update(ApplicationModel $authenticated, ApplicationRequestData $data): ApplicationActionResponseData
    {
        // Belt-and-braces: the DTO carries no id, so we can't accidentally
        // update a different row. Use the authenticated instance directly.
        try {
            return $this->applications->update($authenticated, $data);
        } catch (\Throwable $e) {
            Log::error('Applicant profile update failed', [
                'application_id' => $authenticated->id,
                'error'          => $e->getMessage(),
            ]);
            return ApplicationActionResponseData::error('Failed to update your profile.');
        }
    }
}
