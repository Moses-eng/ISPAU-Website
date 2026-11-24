<?php

namespace App\Modules\Application\Services;

use App\Helpers\AdminNotificationHelper;
use App\Helpers\ApplicantNotificationHelper;
use App\Helpers\MembershipAdminNotificationHelper;
use App\Helpers\OperationsOfficerAdminNotificationHelper;
use App\Mail\ApplicationDraftSavedMail;
use App\Mail\ApplicationStatusUpdatedMail;
use App\Mail\ApplicationSubmittedMail;
use App\Modules\Application\DTOs\ApplicationActionResponseData;
use App\Modules\Application\DTOs\ApplicationRequestData;
use App\Modules\Application\DTOs\ApplicationResponseData;
use App\Modules\Application\Interfaces\ApplicationServiceInterface;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\RepositoryInterfaces\ApplicationRepositoryInterface;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ApplicationService implements ApplicationServiceInterface
{
    public function __construct(
        private readonly ApplicationRepositoryInterface $repository,
        private readonly ApplicationAttachmentService   $attachments,
        private readonly ApplicationSequenceService     $sequence,
    ) {}

    public function listAll(array $filters = []): ApplicationActionResponseData
    {
        try {
            $apps = $this->repository->all($filters);
            $items = $apps
                ->map(fn (ApplicationModel $a) => ApplicationResponseData::fromModel($a)->toArray())
                ->values()
                ->all();

            return ApplicationActionResponseData::success(
                message: 'Applications fetched successfully.',
                application: null,
                payload: ['items' => $items, 'total' => count($items)],
            );
        } catch (\Throwable $e) {
            Log::error('Application list failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Failed to fetch applications.');
        }
    }

    public function show(string $id): ApplicationActionResponseData
    {
        $app = $this->repository->findById($id);
        if (! $app) {
            return ApplicationActionResponseData::error('Application not found.');
        }

        return ApplicationActionResponseData::success(
            message: 'Application fetched successfully.',
            application: ApplicationResponseData::fromModel($app),
        );
    }

    public function create(ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            // 1. Transaction strictly for persistence
            $app = DB::transaction(function () use ($data) {
                $existing = null;
                if ($data->id) {
                    $existing = $this->repository->findById($data->id);
                } elseif (! empty($data->businessEmail)) {
                    $existing = ApplicationModel::where('business_email', $data->businessEmail)
                        ->where('status', 'Draft')
                        ->first();
                }

                $payload = $data->toArray();
                $payload['status'] = 'Submitted';

                // Assign the application number once — on first submission.
                // Covers both brand-new submissions and drafts being promoted.
                $alreadyNumbered = $existing?->application_number;
                if (! $alreadyNumbered) {
                    $payload['application_number'] = $this->sequence->next();
                }

                if ($existing) {
                    $app = $this->repository->update($existing, $payload);
                } else {
                    $app = $this->repository->create($payload);
                }

                if (! empty($data->uploads)) {
                    $paths = $this->attachments->storeAll($app->id, $data->uploads);
                    if (! empty($paths)) {
                        $merged = array_merge($app->attachments ?? [], $paths);
                        $app = $this->repository->update($app, ['attachments' => $merged]);
                    }
                }

                return $app;
            });

            Log::info('Application submitted', [
                'application_id'     => $app->id,
                'application_number' => $app->application_number,
            ]);

            // -------------------------------------------------------------
            // Side-effects outside the transaction (unchanged)
            // -------------------------------------------------------------
            $applicantPortalUrl = rtrim((string) env('FRONTEND_URL', ''));
            $adminPortalUrl     = rtrim((string) env('ADMIN_FRONTEND_URL', ''));

            // 1. Email to Applicant
            $applicantEmail = $app->business_email;
            if ($applicantEmail) {
                try {
                    Mail::to($applicantEmail, $app->applicant_name ?: $app->legal_name)
                        ->send(new ApplicationSubmittedMail(
                            app: $app,
                            portalUrl: $applicantPortalUrl,
                            isInternalNotice: false
                        ));
                    Log::info('Applicant submission email sent', ['recipient' => $applicantEmail]);
                } catch (\Throwable $e) {
                    Log::error('Applicant submission email failed to send', [
                        'application_id' => $app->id,
                        'recipient'      => $applicantEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 2. Email to Organisation Admin
            $orgNotificationEmail = env('APP_NOTIFICATION_EMAIL');
            if ($orgNotificationEmail) {
                try {
                    Mail::to($orgNotificationEmail)
                        ->send(new ApplicationSubmittedMail(
                            app: $app,
                            portalUrl: $adminPortalUrl,
                            isInternalNotice: true
                        ));
                    Log::info('Organisation notification email sent', ['recipient' => $orgNotificationEmail]);
                } catch (\Throwable $e) {
                    Log::error('Organisation notification email failed to send', [
                        'application_id' => $app->id,
                        'recipient'      => $orgNotificationEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 3. In-App Notifications (Applicant + All 3 Admins)
            ApplicantNotificationHelper::notifyApplicationSubmitted($app);
            AdminNotificationHelper::notifyApplicationSubmitted($app);
            OperationsOfficerAdminNotificationHelper::notifyApplicationSubmitted($app);
            MembershipAdminNotificationHelper::notifyApplicationSubmitted($app);

            return ApplicationActionResponseData::success(
                message: "Application {$app->application_number} for {$app->legal_name} submitted successfully.",
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Application creation failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Submission failed: ' . $e->getMessage());
        }
    }
public function saveDraft(ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            // 1. Transaction strictly for persistence
            $app = DB::transaction(function () use ($data) {
                $existing = null;

                if ($data->id) {
                    $existing = $this->repository->findById($data->id);
                }

                // If not found by ID, look up an existing draft by email
                if (! $existing && ! empty($data->businessEmail)) {
                    $existing = ApplicationModel::where('business_email', $data->businessEmail)
                        ->where('status', 'Draft')
                        ->first();
                }

                $payload = array_filter($data->toArray(), fn ($v) => ! is_null($v));
                $payload['status'] = 'Draft';

                // Assign an application number on the first draft save only.
                // Existing drafts keep their assigned number.
                $alreadyNumbered = $existing?->application_number;
                if (! $alreadyNumbered) {
                    $payload['application_number'] = $this->sequence->next();
                }

                if ($existing) {
                    $app = $this->repository->update($existing, $payload);
                } else {
                    $app = $this->repository->create($payload);
                }

                if (! empty($data->uploads)) {
                    $paths = $this->attachments->storeAll($app->id, $data->uploads);
                    if (! empty($paths)) {
                        $merged = array_merge($app->attachments ?? [], $paths);
                        $app = $this->repository->update($app, ['attachments' => $merged]);
                    }
                }

                return $app;
            });

            Log::info('Draft saved', [
                'application_id'     => $app->id,
                'application_number' => $app->application_number,
            ]);

            // 2. Email to Applicant
            $recipientEmail = $app->business_email;
            if ($recipientEmail) {
                try {
                    Mail::to($recipientEmail, $app->applicant_name ?: $app->legal_name)
                        ->send(new ApplicationDraftSavedMail($app));
                } catch (\Throwable $e) {
                    Log::error('Draft confirmation email failed to send', [
                        'application_id' => $app->id,
                        'recipient'      => $recipientEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 3. In-App Notifications (Applicant + All 3 Admins)
            ApplicantNotificationHelper::notifyDraftSaved($app);
            AdminNotificationHelper::notifyDraftSaved($app);
            OperationsOfficerAdminNotificationHelper::notifyDraftSaved($app);
            MembershipAdminNotificationHelper::notifyDraftSaved($app);

            return ApplicationActionResponseData::success(
                message: 'Draft saved to server successfully.',
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Draft save failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Failed to save draft: ' . $e->getMessage());
        }
    }

    public function create1(ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            // 1. Transaction strictly for persistence
            $app = DB::transaction(function () use ($data) {
                $existing = null;
                if ($data->id) {
                    $existing = $this->repository->findById($data->id);
                } elseif (! empty($data->businessEmail)) {
                    $existing = ApplicationModel::where('business_email', $data->businessEmail)
                        ->where('status', 'Draft')
                        ->first();
                }

                $payload = $data->toArray();
                $payload['status'] = 'Submitted';

                if ($existing) {
                    $app = $this->repository->update($existing, $payload);
                } else {
                    $app = $this->repository->create($payload);
                }

                if (! empty($data->uploads)) {
                    $paths = $this->attachments->storeAll($app->id, $data->uploads);
                    if (! empty($paths)) {
                        $merged = array_merge($app->attachments ?? [], $paths);
                        $app = $this->repository->update($app, ['attachments' => $merged]);
                    }
                }

                return $app;
            });

            Log::info('Application submitted', ['application_id' => $app->id]);

            // -------------------------------------------------------------
            // Side-effects outside the transaction
            // -------------------------------------------------------------
            $applicantPortalUrl = rtrim((string) env('FRONTEND_URL', ''));
            $adminPortalUrl     = rtrim((string) env('ADMIN_FRONTEND_URL', ''));

            // 1. Email to Applicant
            $applicantEmail = $app->business_email;
            if ($applicantEmail) {
                try {
                    Mail::to($applicantEmail, $app->applicant_name ?: $app->legal_name)
                        ->send(new ApplicationSubmittedMail(
                            app: $app,
                            portalUrl: $applicantPortalUrl,
                            isInternalNotice: false
                        ));
                    Log::info('Applicant submission email sent', ['recipient' => $applicantEmail]);
                } catch (\Throwable $e) {
                    Log::error('Applicant submission email failed to send', [
                        'application_id' => $app->id,
                        'recipient'      => $applicantEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 2. Email to Organisation Admin
            $orgNotificationEmail = env('APP_NOTIFICATION_EMAIL');
            if ($orgNotificationEmail) {
                try {
                    Mail::to($orgNotificationEmail)
                        ->send(new ApplicationSubmittedMail(
                            app: $app,
                            portalUrl: $adminPortalUrl,
                            isInternalNotice: true
                        ));
                    Log::info('Organisation notification email sent', ['recipient' => $orgNotificationEmail]);
                } catch (\Throwable $e) {
                    Log::error('Organisation notification email failed to send', [
                        'application_id' => $app->id,
                        'recipient'      => $orgNotificationEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 3. In-App Notifications (Applicant + All 3 Admins)
            ApplicantNotificationHelper::notifyApplicationSubmitted($app);
            AdminNotificationHelper::notifyApplicationSubmitted($app);
            OperationsOfficerAdminNotificationHelper::notifyApplicationSubmitted($app);
            MembershipAdminNotificationHelper::notifyApplicationSubmitted($app);

            return ApplicationActionResponseData::success(
                message: "Application for {$app->legal_name} submitted successfully.",
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Application creation failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Submission failed: ' . $e->getMessage());
        }
    }

    public function saveDraft1(ApplicationRequestData $data): ApplicationActionResponseData
    {
        try {
            // 1. Transaction strictly for persistence
            $app = DB::transaction(function () use ($data) {
                $existing = null;
                if ($data->id) {
                    $existing = $this->repository->findById($data->id);
                } elseif (! empty($data->businessEmail)) {
                    $existing = ApplicationModel::where('business_email', $data->businessEmail)
                        ->where('status', 'Draft')
                        ->first();
                }

                $payload = array_filter($data->toArray(), fn ($v) => ! is_null($v));
                $payload['status'] = 'Draft';

                if ($existing) {
                    $app = $this->repository->update($existing, $payload);
                } else {
                    $app = $this->repository->create($payload);
                }

                if (! empty($data->uploads)) {
                    $paths = $this->attachments->storeAll($app->id, $data->uploads);
                    if (! empty($paths)) {
                        $merged = array_merge($app->attachments ?? [], $paths);
                        $app = $this->repository->update($app, ['attachments' => $merged]);
                    }
                }

                return $app;
            });

            // 2. Email to Applicant
            $recipientEmail = $app->business_email;
            if ($recipientEmail) {
                try {
                    Mail::to($recipientEmail, $app->applicant_name ?: $app->legal_name)
                        ->send(new ApplicationDraftSavedMail($app));
                } catch (\Throwable $e) {
                    Log::error('Draft confirmation email failed to send', [
                        'application_id' => $app->id,
                        'recipient'      => $recipientEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 3. In-App Notifications (Applicant + All 3 Admins)
            ApplicantNotificationHelper::notifyDraftSaved($app);
            AdminNotificationHelper::notifyDraftSaved($app);
            OperationsOfficerAdminNotificationHelper::notifyDraftSaved($app);
            MembershipAdminNotificationHelper::notifyDraftSaved($app);

            return ApplicationActionResponseData::success(
                message: 'Draft saved to server successfully.',
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Draft save failed', ['error' => $e->getMessage()]);
            return ApplicationActionResponseData::error('Failed to save draft: ' . $e->getMessage());
        }
    }

    public function updateStatus(ApplicationModel $application, string $status): ApplicationActionResponseData
    {
        try {
            $application->update(['status' => $status]);
            $app = $application->fresh();

            // 1. Email to Applicant
            $recipientEmail = $app->business_email;
            if ($recipientEmail) {
                try {
                    Mail::to($recipientEmail, $app->legal_name)
                        ->send(new ApplicationStatusUpdatedMail($app, $status));
                } catch (\Throwable $e) {
                    Log::error('Status update email failed to send', [
                        'application_id' => $app->id,
                        'status'         => $status,
                        'recipient'      => $recipientEmail,
                        'error'          => $e->getMessage(),
                    ]);
                }
            }

            // 2. In-App Notifications (Applicant + All 3 Admins)
            ApplicantNotificationHelper::notifyStatusUpdated($app, $status);
            AdminNotificationHelper::notifyStatusUpdated($app, $status);
            OperationsOfficerAdminNotificationHelper::notifyStatusUpdated($app, $status);
            MembershipAdminNotificationHelper::notifyStatusUpdated($app, $status);

            return ApplicationActionResponseData::success(
                message: 'Application status updated successfully.',
                application: ApplicationResponseData::fromModel($app),
            );
        } catch (\Throwable $e) {
            Log::error('Application status update failed', [
                'application_id' => $application->id,
                'status'         => $status,
                'error'          => $e->getMessage(),
            ]);

            return ApplicationActionResponseData::error('Failed to update application status.');
        }
    }

    public function delete(ApplicationModel $application): ApplicationActionResponseData
    {
        try {
            $legalName      = $application->legal_name;
            $applicantId    = $application->id;
            $applicantName  = $application->applicant_name ?: $application->legal_name;
            $applicantEmail = $application->business_email;

            // Delete storage assets
            $this->attachments->deleteDirectory($application->id);

            // In-App Admin Notifications for All 3 Admins (must be called before delete if foreign key cascade exists)
            AdminNotificationHelper::notifyApplicationDeleted($legalName, $applicantId, $applicantName, $applicantEmail);
            OperationsOfficerAdminNotificationHelper::notifyApplicationDeleted($legalName, $applicantId, $applicantName, $applicantEmail);
            MembershipAdminNotificationHelper::notifyApplicationDeleted($legalName, $applicantId, $applicantName, $applicantEmail);

            // In-App Applicant Notification
            ApplicantNotificationHelper::notifyApplicationDeleted($legalName, $applicantId, $applicantName);

            // Delete record
            $this->repository->delete($application);

            Log::info('Application deleted', ['application_id' => $applicantId]);

            return ApplicationActionResponseData::success(
                message: 'Application deleted successfully.',
                application: null,
            );
        } catch (\Throwable $e) {
            Log::error('Application delete failed', [
                'application_id' => $application->id,
                'error'          => $e->getMessage(),
            ]);
            return ApplicationActionResponseData::error('Failed to delete application.');
        }
    }

    public function downloadSummaryPdf(string $id)
    {
        $app = $this->repository->findById($id);
        if (! $app) {
            abort(404, 'Application not found.');
        }

        $pdf = Pdf::loadView('pdfs.application_summary', [
            'app' => $app,
        ])
        ->setPaper('a4', 'portrait')
        ->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled'      => true,
            'defaultFont'          => 'sans-serif',
        ]);

        $safeName = Str::slug($app->legal_name ?: $app->id);
        $filename = "ISPAU_Application_{$safeName}.pdf";

        return $pdf->download($filename);
    }
}
