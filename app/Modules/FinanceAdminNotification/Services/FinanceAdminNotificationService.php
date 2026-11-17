<?php

namespace App\Modules\FinanceAdminNotification\Services;

use App\Modules\FinanceAdminNotification\DTOs\FinanceAdminNotificationActionResponseData;
use App\Modules\FinanceAdminNotification\DTOs\FinanceAdminNotificationRequestData;
use App\Modules\FinanceAdminNotification\DTOs\FinanceAdminNotificationResponseData;
use App\Modules\FinanceAdminNotification\Interfaces\FinanceAdminNotificationServiceInterface;
use App\Modules\FinanceAdminNotification\Models\FinanceAdminNotificationModel;
use App\Modules\FinanceAdminNotification\RepositoryInterfaces\FinanceAdminNotificationRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class FinanceAdminNotificationService implements FinanceAdminNotificationServiceInterface
{
    public function __construct(
        private readonly FinanceAdminNotificationRepositoryInterface $repository,
    ) {}

    public function list(array $filters = [], int $perPage = 20): FinanceAdminNotificationActionResponseData
    {
        try {
            $paginator = $this->repository->paginate($filters, $perPage);

            $items = collect($paginator->items())
                ->map(fn (FinanceAdminNotificationModel $m) => FinanceAdminNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return FinanceAdminNotificationActionResponseData::success(
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
            Log::error('Finance admin notification list failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to fetch notifications.');
        }
    }

    public function recent(int $limit = 6): FinanceAdminNotificationActionResponseData
    {
        try {
            $items = $this->repository->recent($limit)
                ->map(fn (FinanceAdminNotificationModel $m) => FinanceAdminNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return FinanceAdminNotificationActionResponseData::success(
                'Recent notifications fetched successfully.',
                null,
                [
                    'items'        => $items,
                    'unread_count' => $this->repository->unreadCount(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Finance admin recent notifications failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to fetch recent notifications.');
        }
    }

    public function show(string $id): FinanceAdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return FinanceAdminNotificationActionResponseData::error('Notification not found.');
        }

        return FinanceAdminNotificationActionResponseData::success(
            'Notification fetched successfully.',
            FinanceAdminNotificationResponseData::fromModel($notification)
        );
    }

    public function create(FinanceAdminNotificationRequestData $data): FinanceAdminNotificationActionResponseData
    {
        if (! $data->applicant_id) {
            throw ValidationException::withMessages([
                'applicant_id' => ['Applicant ID is required.'],
            ]);
        }

        try {
            $notification = $this->repository->create($data->toArray());

            return FinanceAdminNotificationActionResponseData::success(
                'Notification created successfully.',
                FinanceAdminNotificationResponseData::fromModel($notification)
            );
        } catch (\Throwable $e) {
            Log::error('Finance admin notification creation failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to create notification.');
        }
    }

    public function markAsRead(string $id): FinanceAdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return FinanceAdminNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $updated = $this->repository->markAsRead($notification);

            return FinanceAdminNotificationActionResponseData::success(
                'Notification marked as read.',
                FinanceAdminNotificationResponseData::fromModel($updated)
            );
        } catch (\Throwable $e) {
            Log::error('Finance admin mark-as-read failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to mark notification as read.');
        }
    }

    public function markAllAsRead(): FinanceAdminNotificationActionResponseData
    {
        try {
            $count = $this->repository->markAllAsRead();

            return FinanceAdminNotificationActionResponseData::success(
                'All notifications marked as read.',
                null,
                ['updated_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Finance admin mark-all-as-read failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to mark all notifications as read.');
        }
    }

    public function delete(string $id): FinanceAdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return FinanceAdminNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $this->repository->delete($notification);
            return FinanceAdminNotificationActionResponseData::success('Notification deleted successfully.');
        } catch (\Throwable $e) {
            Log::error('Finance admin notification delete failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to delete notification.');
        }
    }

    public function bulkDelete(array $ids): FinanceAdminNotificationActionResponseData
    {
        try {
            $count = $this->repository->bulkDelete($ids);
            return FinanceAdminNotificationActionResponseData::success(
                'Notifications deleted successfully.',
                null,
                ['deleted_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Finance admin notification bulk delete failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to delete notifications.');
        }
    }

    public function statistics(): FinanceAdminNotificationActionResponseData
    {
        try {
            return FinanceAdminNotificationActionResponseData::success(
                'Notification statistics fetched successfully.',
                null,
                $this->repository->statistics()
            );
        } catch (\Throwable $e) {
            Log::error('Finance admin notification statistics failed', ['error' => $e->getMessage()]);
            return FinanceAdminNotificationActionResponseData::error('Failed to fetch statistics.');
        }
    }
}
