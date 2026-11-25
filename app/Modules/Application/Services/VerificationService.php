<?php

namespace App\Modules\Application\Services;

use App\Helpers\AdminNotificationHelper;
use App\Helpers\ApplicantNotificationHelper;
use App\Helpers\MembershipAdminNotificationHelper;
use App\Helpers\OperationsOfficerAdminNotificationHelper;
use App\Mail\VerificationRecordedMail;
use App\Modules\Application\DTOs\VerificationActionResponseData;
use App\Modules\Application\DTOs\VerificationRequestData;
use App\Modules\Application\DTOs\VerificationResponseData;
use App\Modules\Application\Interfaces\VerificationServiceInterface;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\Models\VerificationModel;
use App\Modules\Application\RepositoryInterfaces\VerificationRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
            $isAllVerified = false;
            $application = null;

            // 1. Transaction strictly for persistence
            $verification = DB::transaction(function () use ($data, &$isAllVerified, &$application) {
                $verification = $this->repository->create($data->toCreateArray());

                // Resolve check results (supports either direct columns or nested checks array)
                $registrationResult = $verification->registration_result
                    ?? data_get($verification->checks, 'registration.result');
                $authorityResult = $verification->authority_result
                    ?? data_get($verification->checks, 'authority.result');
                $regulatoryResult = $verification->regulatory_result
                    ?? data_get($verification->checks, 'regulatory.result');

                $isAllVerified = ($registrationResult === 'Verified')
                    && ($authorityResult === 'Verified')
                    && ($regulatoryResult === 'Verified');

                // If all 3 checks are 'Verified', transition status to 'Decision pending'
                if ($isAllVerified) {
                    $application = ApplicationModel::find($data->applicationId);
                    if ($application && ! in_array($application->status, ['Active', 'Declined'])) {
                        $application->update(['status' => 'Decision pending']);
                    }
                }

                return $verification;
            });

            Log::info('Verification recorded', [
                'application_id'  => $data->applicationId,
                'verification_id' => $verification->id,
                'reviewer_id'     => $data->reviewerId,
                'all_verified'    => $isAllVerified,
            ]);

            // -------------------------------------------------------------
            // Side-effects outside the transaction
            // -------------------------------------------------------------

            // 2. Retrieve Applicant details using ApplicationModel static helpers
            $applicationNumber = ApplicationModel::getApplicationNumber($data->applicationId);
            $applicantName     = ApplicationModel::getApplicateName($data->applicationId);
            $applicantEmail    = ApplicationModel::getApplicateEmail($data->applicationId);

            $applicantPortalUrl = rtrim((string) env('FRONTEND_URL', ''));

            // 3. Email to Applicant
            if ($applicantEmail) {
                try {
                    Mail::to($applicantEmail, $applicantName ?: 'Valued Applicant')
                        ->send(new VerificationRecordedMail(
                            verification: $verification,
                            applicationNumber: $applicationNumber,
                            applicantName: $applicantName,
                            portalUrl: $applicantPortalUrl
                        ));

                    Log::info('Applicant verification email sent', [
                        'recipient'      => $applicantEmail,
                        'application_id' => $data->applicationId,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Applicant verification email failed to send', [
                        'application_id'  => $data->applicationId,
                        'verification_id' => $verification->id,
                        'recipient'       => $applicantEmail,
                        'error'           => $e->getMessage(),
                    ]);
                }
            }

            // 4. In-App Notification for Verification
            $verificationNotice = "Verification checks for your membership application"
                . ($applicationNumber ? " ({$applicationNumber})" : "")
                . " have been recorded.";

            ApplicantNotificationHelper::createNotification(
                title: 'Application Verification Recorded',
                message: $verificationNotice,
                applicantId: $data->applicationId,
                applicantName: $applicantName,
                type: 'info'
            );

            // 5. In-App Notifications for Status Transition if All Checks are Verified
            if ($isAllVerified && $application) {
                $freshApp = $application->fresh();
                ApplicantNotificationHelper::notifyStatusUpdated($freshApp, 'Decision pending');
                AdminNotificationHelper::notifyStatusUpdated($freshApp, 'Decision pending');
                OperationsOfficerAdminNotificationHelper::notifyStatusUpdated($freshApp, 'Decision pending');
                MembershipAdminNotificationHelper::notifyStatusUpdated($freshApp, 'Decision pending');
            }

            $successMessage = $isAllVerified
                ? 'Verification recorded and application moved to Decision pending.'
                : 'Record verification saved.';

            return VerificationActionResponseData::success(
                message: $successMessage,
                verification: VerificationResponseData::fromModel($verification),
            );
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
