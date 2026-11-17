<?php

namespace App\Modules\ApplicantNotification\Services;

use App\Modules\ApplicantNotification\DTOs\ApplicantNotificationActionResponseData;
use App\Modules\ApplicantNotification\DTOs\ApplicantNotificationRequestData;
use App\Modules\ApplicantNotification\DTOs\ApplicantNotificationResponseData;
use App\Modules\ApplicantNotification\Interfaces\ApplicantNotificationServiceInterface;
use App\Modules\ApplicantNotification\Models\ApplicantNotificationModel;
use App\Modules\ApplicantNotification\RepositoryInterfaces\ApplicantNotificationRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ApplicantNotificationService implements ApplicantNotificationServiceInterface
{
    public function __construct(
        private readonly ApplicantNotificationRepositoryInterface $repository,
    ) {}

    public function listForApplicant(string $applicantId, array $filters = [], int $perPage = 20): ApplicantNotificationActionResponseData
    {
        try {
            $paginator = $this->repository->paginateByApplicant($applicantId, $filters, $perPage);

            $items = collect($paginator->items())
                ->map(fn (ApplicantNotificationModel $m) => ApplicantNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return ApplicantNotificationActionResponseData::success(
                'Notifications fetched successfully.',
                null,
                [
                    'items'        => $items,
                    'pagination'   => [
                        'current_page' => $paginator->currentPage(),
                        'per_page'     => $paginator->perPage(),
                        'total'        => $paginator->total(),
                        'last_page'    => $paginator->lastPage(),
                    ],
                    'unread_count' => $this->repository->unreadCount($applicantId),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Applicant notification list failed', [
                'applicant_id' => $applicantId,
                'error'        => $e->getMessage(),
            ]);
            return ApplicantNotificationActionResponseData::error('Failed to fetch notifications.');
        }
    }

    public function recentForApplicant(string $applicantId, int $limit = 6): ApplicantNotificationActionResponseData
    {
        try {
            $items = $this->repository->recentByApplicant($applicantId, $limit)
                ->map(fn (ApplicantNotificationModel $m) => ApplicantNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return ApplicantNotificationActionResponseData::success(
                'Recent notifications fetched successfully.',
                null,
                [
                    'items'        => $items,
                    'unread_count' => $this->repository->unreadCount($applicantId),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Applicant recent notifications failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to fetch recent notifications.');
        }
    }

    public function show(int $id): ApplicantNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return ApplicantNotificationActionResponseData::error('Notification not found.');
        }

        return ApplicantNotificationActionResponseData::success(
            'Notification fetched successfully.',
            ApplicantNotificationResponseData::fromModel($notification)
        );
    }

    public function create(ApplicantNotificationRequestData $data): ApplicantNotificationActionResponseData
    {
        if (! $data->applicant_id) {
            throw ValidationException::withMessages([
                'applicant_id' => ['Applicant ID is required.'],
            ]);
        }

        try {
            $notification = $this->repository->create($data->toArray());

            return ApplicantNotificationActionResponseData::success(
                'Notification created successfully.',
                ApplicantNotificationResponseData::fromModel($notification)
            );
        } catch (\Throwable $e) {
            Log::error('Applicant notification creation failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to create notification.');
        }
    }

    public function markAsRead(int $id): ApplicantNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return ApplicantNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $updated = $this->repository->markAsRead($notification);

            return ApplicantNotificationActionResponseData::success(
                'Notification marked as read.',
                ApplicantNotificationResponseData::fromModel($updated)
            );
        } catch (\Throwable $e) {
            Log::error('Applicant mark-as-read failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to mark notification as read.');
        }
    }

    public function markAllAsRead(string $applicantId): ApplicantNotificationActionResponseData
    {
        try {
            $count = $this->repository->markAllAsRead($applicantId);

            return ApplicantNotificationActionResponseData::success(
                'All notifications marked as read.',
                null,
                ['updated_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Applicant mark-all-as-read failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to mark all notifications as read.');
        }
    }

    public function delete(int $id): ApplicantNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return ApplicantNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $this->repository->delete($notification);
            return ApplicantNotificationActionResponseData::success('Notification deleted successfully.');
        } catch (\Throwable $e) {
            Log::error('Applicant notification delete failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to delete notification.');
        }
    }

    public function bulkDelete(array $ids): ApplicantNotificationActionResponseData
    {
        try {
            $count = $this->repository->bulkDelete($ids);
            return ApplicantNotificationActionResponseData::success(
                'Notifications deleted successfully.',
                null,
                ['deleted_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Applicant notification bulk delete failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to delete notifications.');
        }
    }

    public function statistics(string $applicantId): ApplicantNotificationActionResponseData
    {
        try {
            return ApplicantNotificationActionResponseData::success(
                'Notification statistics fetched successfully.',
                null,
                $this->repository->statistics($applicantId)
            );
        } catch (\Throwable $e) {
            Log::error('Applicant notification statistics failed', ['error' => $e->getMessage()]);
            return ApplicantNotificationActionResponseData::error('Failed to fetch statistics.');
        }
    }
}
