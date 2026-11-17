<?php

namespace App\Modules\AdminNotification\Services;

use App\Modules\AdminNotification\DTOs\AdminNotificationActionResponseData;
use App\Modules\AdminNotification\DTOs\AdminNotificationRequestData;
use App\Modules\AdminNotification\DTOs\AdminNotificationResponseData;
use App\Modules\AdminNotification\Interfaces\AdminNotificationServiceInterface;
use App\Modules\AdminNotification\Models\AdminNotificationModel;
use App\Modules\AdminNotification\RepositoryInterfaces\AdminNotificationRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminNotificationService implements AdminNotificationServiceInterface
{
    public function __construct(
        private readonly AdminNotificationRepositoryInterface $repository,
    ) {}

    public function list(array $filters = [], int $perPage = 20): AdminNotificationActionResponseData
    {
        try {
            $paginator = $this->repository->paginate($filters, $perPage);

            $items = collect($paginator->items())
                ->map(fn (AdminNotificationModel $m) => AdminNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return AdminNotificationActionResponseData::success(
                'Notifications fetched successfully.',
                null,
                [
                    'items'      => $items,
                    'pagination' => [
                        'current_page' => $paginator->currentPage(),
                        'per_page'     => $paginator->perPage(),
                        'total'        => $paginator->total(),
                        'last_page'    => $paginator->lastPage(),
                    ],
                    'unread_count' => $this->repository->unreadCount(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Admin notification list failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to fetch notifications.');
        }
    }

    public function recent(int $limit = 6): AdminNotificationActionResponseData
    {
        try {
            $items = $this->repository->recent($limit)
                ->map(fn (AdminNotificationModel $m) => AdminNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return AdminNotificationActionResponseData::success(
                'Recent notifications fetched successfully.',
                null,
                [
                    'items'        => $items,
                    'unread_count' => $this->repository->unreadCount(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Admin recent notifications failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to fetch recent notifications.');
        }
    }

    public function show(string $id): AdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return AdminNotificationActionResponseData::error('Notification not found.');
        }

        return AdminNotificationActionResponseData::success(
            'Notification fetched successfully.',
            AdminNotificationResponseData::fromModel($notification)
        );
    }

    public function create(AdminNotificationRequestData $data): AdminNotificationActionResponseData
    {
        if (! $data->applicant_id) {
            throw ValidationException::withMessages([
                'applicant_id' => ['Applicant ID is required.'],
            ]);
        }

        try {
            $notification = $this->repository->create($data->toArray());

            return AdminNotificationActionResponseData::success(
                'Notification created successfully.',
                AdminNotificationResponseData::fromModel($notification)
            );
        } catch (\Throwable $e) {
            Log::error('Admin notification creation failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to create notification.');
        }
    }

    public function markAsRead(string $id): AdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return AdminNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $updated = $this->repository->markAsRead($notification);

            return AdminNotificationActionResponseData::success(
                'Notification marked as read.',
                AdminNotificationResponseData::fromModel($updated)
            );
        } catch (\Throwable $e) {
            Log::error('Admin mark-as-read failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to mark notification as read.');
        }
    }

    public function markAllAsRead(): AdminNotificationActionResponseData
    {
        try {
            $count = $this->repository->markAllAsRead();

            return AdminNotificationActionResponseData::success(
                'All notifications marked as read.',
                null,
                ['updated_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Admin mark-all-as-read failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to mark all notifications as read.');
        }
    }

    public function delete(string $id): AdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return AdminNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $this->repository->delete($notification);
            return AdminNotificationActionResponseData::success('Notification deleted successfully.');
        } catch (\Throwable $e) {
            Log::error('Admin notification delete failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to delete notification.');
        }
    }

    public function bulkDelete(array $ids): AdminNotificationActionResponseData
    {
        try {
            $count = $this->repository->bulkDelete($ids);
            return AdminNotificationActionResponseData::success(
                'Notifications deleted successfully.',
                null,
                ['deleted_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Admin notification bulk delete failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to delete notifications.');
        }
    }

    public function statistics(): AdminNotificationActionResponseData
    {
        try {
            return AdminNotificationActionResponseData::success(
                'Notification statistics fetched successfully.',
                null,
                $this->repository->statistics()
            );
        } catch (\Throwable $e) {
            Log::error('Admin notification statistics failed', ['error' => $e->getMessage()]);
            return AdminNotificationActionResponseData::error('Failed to fetch statistics.');
        }
    }
}
