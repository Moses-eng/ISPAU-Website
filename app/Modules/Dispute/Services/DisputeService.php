<?php

namespace App\Modules\Dispute\Services;

use App\Helpers\AdminNotificationHelper;
use App\Helpers\MembershipAdminNotificationHelper;
use App\Helpers\OperationsOfficerAdminNotificationHelper;
use App\Mail\DisputeSubmittedMail;
use App\Modules\Dispute\DTOs\DisputeActionResponseData;
use App\Modules\Dispute\DTOs\DisputeRequestData;
use App\Modules\Dispute\DTOs\DisputeResponseData;
use App\Modules\Dispute\Interfaces\DisputeServiceInterface;
use App\Modules\Dispute\Models\DisputeModel;
use App\Modules\Dispute\RepositoryInterfaces\DisputeRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class DisputeService implements DisputeServiceInterface
{
    public function __construct(
        private readonly DisputeRepositoryInterface $repository,
    ) {}

    // ==================== LIST ====================

    public function listAll(array $filters = []): DisputeActionResponseData
    {
        try {
            $disputes = $this->repository->all($filters);

            $items = $disputes
                ->map(fn (DisputeModel $d) => DisputeResponseData::fromModel($d)->toArray())
                ->values()
                ->all();

            return DisputeActionResponseData::success(
                message: 'Disputes fetched successfully.',
                dispute: null,
                payload: [
                    'items' => $items,
                    'total' => count($items),
                ],
            );
        } catch (\Throwable $e) {
            Log::error('Dispute list failed', [
                'error'   => $e->getMessage(),
                'filters' => $filters,
            ]);
            return DisputeActionResponseData::error('Failed to fetch disputes.');
        }
    }

    // ==================== SHOW ====================

    public function show(string $id): DisputeActionResponseData
    {
        $dispute = $this->repository->findById($id);
        if (! $dispute) {
            return DisputeActionResponseData::error('Dispute not found.');
        }

        return DisputeActionResponseData::success(
            message: 'Dispute fetched successfully.',
            dispute: DisputeResponseData::fromModel($dispute),
        );
    }

    // ==================== CREATE ====================

    public function create(DisputeRequestData $data): DisputeActionResponseData
    {
        try {
            // 1. Transaction strictly for persistence
            $dispute = DB::transaction(function () use ($data) {
                $attributes = $data->toArray();

                // 🔒 Force pending status on creation
                $attributes['status'] = 'pending';

                return $this->repository->create($attributes);
            });

            Log::info('Dispute created successfully', ['dispute_id' => $dispute->id]);

            // -------------------------------------------------------------
            // Side-effects outside the transaction
            // -------------------------------------------------------------
            $frontendUrl    = rtrim((string) env('FRONTEND_URL', ''));
            $adminPortalUrl = rtrim((string) env('ADMIN_FRONTEND_URL', ''));

            // 1. Send confirmation email to User/Customer
            if (! empty($dispute->email)) {
                try {
                    Mail::to($dispute->email, $dispute->name)
                        ->send(new DisputeSubmittedMail(
                            dispute: $dispute,
                            portalUrl: $frontendUrl,
                            isInternalNotice: false
                        ));
                    Log::info('Dispute confirmation email sent to user', [
                        'dispute_id' => $dispute->id,
                        'recipient'  => $dispute->email,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Dispute confirmation email failed to send', [
                        'dispute_id' => $dispute->id,
                        'recipient'  => $dispute->email,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            // 2. Send notice email to Admin / Organisation
            $orgNotificationEmail = env('APP_NOTIFICATION_EMAIL', config('mail.from.address'));
            if ($orgNotificationEmail) {
                try {
                    Mail::to($orgNotificationEmail)
                        ->send(new DisputeSubmittedMail(
                            dispute: $dispute,
                            portalUrl: $adminPortalUrl,
                            isInternalNotice: true
                        ));
                    Log::info('Dispute alert email sent to organisation admin', [
                        'dispute_id' => $dispute->id,
                        'recipient'  => $orgNotificationEmail,
                    ]);
                } catch (\Throwable $e) {
                    Log::error('Dispute admin notification email failed to send', [
                        'dispute_id' => $dispute->id,
                        'recipient'  => $orgNotificationEmail,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            // 3. Create Admin In-App Notifications for all 3 admin roles
            try {
                $recordRef = $dispute->recordId ? " (Case Ref: {$dispute->recordId})" : '';
                $title     = 'New Dispute / Appeal Submitted';
                $message   = "A new dispute or record request has been filed by '{$dispute->name}'{$recordRef} and is awaiting review.";

                // General Admin
                AdminNotificationHelper::createNotification(
                    title: $title,
                    message: $message,
                    applicantId: $dispute->id,
                    applicantName: $dispute->name,
                    applicantEmail: $dispute->email,
                    type: 'warning'
                );

                // Operations Officer
                OperationsOfficerAdminNotificationHelper::createNotification(
                    title: $title,
                    message: $message,
                    applicantId: $dispute->id,
                    applicantName: $dispute->name,
                    applicantEmail: $dispute->email,
                    type: 'warning'
                );

                // Membership Admin
                MembershipAdminNotificationHelper::createNotification(
                    title: $title,
                    message: $message,
                    applicantId: $dispute->id,
                    applicantName: $dispute->name,
                    applicantEmail: $dispute->email,
                    type: 'warning'
                );
            } catch (\Throwable $e) {
                Log::warning('Failed to create in-app admin notifications for dispute', [
                    'dispute_id' => $dispute->id,
                    'error'      => $e->getMessage(),
                ]);
            }

            return DisputeActionResponseData::success(
                message: "Dispute from {$dispute->name} created successfully.",
                dispute: DisputeResponseData::fromModel($dispute),
            );
        } catch (\Throwable $e) {
            Log::error('Dispute creation failed', ['error' => $e->getMessage()]);
            return DisputeActionResponseData::error(
                'Creation failed: ' . $e->getMessage()
            );
        }
    }

    // ==================== UPDATE ====================

    public function update(DisputeModel $dispute, DisputeRequestData $data): DisputeActionResponseData
    {
        try {
            $updated = $this->repository->update($dispute, $data->toArray());

            return DisputeActionResponseData::success(
                message: 'Dispute updated successfully.',
                dispute: DisputeResponseData::fromModel($updated),
            );
        } catch (\Throwable $e) {
            Log::error('Dispute update failed', [
                'dispute_id' => $dispute->id,
                'error'      => $e->getMessage(),
            ]);
            return DisputeActionResponseData::error('Failed to update dispute.');
        }
    }

    // ==================== DELETE ====================

    public function delete(DisputeModel $dispute): DisputeActionResponseData
    {
        try {
            $this->repository->delete($dispute);

            Log::info('Dispute deleted', [
                'dispute_id' => $dispute->id,
                'name'       => $dispute->name,
            ]);

            return DisputeActionResponseData::success(
                message: 'Dispute deleted successfully.',
                dispute: null,
            );
        } catch (\Throwable $e) {
            Log::error('Dispute delete failed', [
                'dispute_id' => $dispute->id,
                'error'      => $e->getMessage(),
            ]);
            return DisputeActionResponseData::error('Failed to delete dispute.');
        }
    }
}
