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
     * Update only the defined fields for the authenticated applicant's profile.
     */
    public function update(ApplicationModel $authenticated, array $data): ApplicationActionResponseData
    {
        try {
            // Mapping from request input keys (camelCase) to database columns (snake_case)
            $allowedFields = [
                'legalName'             => 'legal_name',
                'tradingName'           => 'trading_name',
                'businessEmail'         => 'business_email',
                'businessPhone'         => 'business_phone',
                'website'               => 'website',
                'registeredAddress'     => 'registered_address',
                'ugandaAddress'         => 'uganda_address',
                'representativeName'    => 'representative_name',
                'representativeRole'    => 'representative_role',
                'representativeEmail'   => 'representative_email',
                'representativePhone'   => 'representative_phone',
                'billingEmail'          => 'billing_email',
                'billingContact'        => 'billing_contact',
                'invoiceAddress'        => 'invoice_address',
            ];

            $updates = [];

            // Update ONLY fields that are explicitly provided in the request
            foreach ($allowedFields as $inputKey => $dbColumn) {
                if (array_key_exists($inputKey, $data)) {
                    $updates[$dbColumn] = $data[$inputKey];
                } elseif (array_key_exists($dbColumn, $data)) {
                    $updates[$dbColumn] = $data[$dbColumn];
                }
            }

            if (! empty($updates)) {
                $authenticated->fill($updates);
                $authenticated->save();
            }

            $authenticated->refresh();

            return ApplicationActionResponseData::success(
                message: 'Company profile updated successfully.',
                application: ApplicationResponseData::fromModel($authenticated),
            );
        } catch (\Throwable $e) {
            Log::error('Applicant profile update failed', [
                'application_id' => $authenticated->id,
                'error'          => $e->getMessage(),
            ]);

            return ApplicationActionResponseData::error('Failed to update your profile.');
        }
    }
}
