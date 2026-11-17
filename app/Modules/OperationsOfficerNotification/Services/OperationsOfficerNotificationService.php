<?php

namespace App\Modules\OperationsOfficerNotification\Services;

use App\Modules\OperationsOfficerNotification\DTOs\OperationsOfficerNotificationActionResponseData;
use App\Modules\OperationsOfficerNotification\DTOs\OperationsOfficerNotificationRequestData;
use App\Modules\OperationsOfficerNotification\DTOs\OperationsOfficerNotificationResponseData;
use App\Modules\OperationsOfficerNotification\Interfaces\OperationsOfficerNotificationServiceInterface;
use App\Modules\OperationsOfficerNotification\Models\OperationsOfficerNotificationModel;
use App\Modules\OperationsOfficerNotification\RepositoryInterfaces\OperationsOfficerNotificationRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class OperationsOfficerNotificationService implements OperationsOfficerNotificationServiceInterface
{
    public function __construct(
        private readonly OperationsOfficerNotificationRepositoryInterface $repository,
    ) {}

    public function list(array $filters = [], int $perPage = 20): OperationsOfficerNotificationActionResponseData
    {
        try {
            $paginator = $this->repository->paginate($filters, $perPage);

            $items = collect($paginator->items())
                ->map(fn (OperationsOfficerNotificationModel $m) => OperationsOfficerNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return OperationsOfficerNotificationActionResponseData::success(
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
            Log::error('Operations officer notification list failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to fetch notifications.');
        }
    }

    public function recent(int $limit = 6): OperationsOfficerNotificationActionResponseData
    {
        try {
            $items = $this->repository->recent($limit)
                ->map(fn (OperationsOfficerNotificationModel $m) => OperationsOfficerNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return OperationsOfficerNotificationActionResponseData::success(
                'Recent notifications fetched successfully.',
                null,
                [
                    'items'        => $items,
                    'unread_count' => $this->repository->unreadCount(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Operations officer recent notifications failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to fetch recent notifications.');
        }
    }

    public function show(string $id): OperationsOfficerNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return OperationsOfficerNotificationActionResponseData::error('Notification not found.');
        }

        return OperationsOfficerNotificationActionResponseData::success(
            'Notification fetched successfully.',
            OperationsOfficerNotificationResponseData::fromModel($notification)
        );
    }

    public function create(OperationsOfficerNotificationRequestData $data): OperationsOfficerNotificationActionResponseData
    {
        if (! $data->applicant_id) {
            throw ValidationException::withMessages([
                'applicant_id' => ['Applicant ID is required.'],
            ]);
        }

        try {
            $notification = $this->repository->create($data->toArray());

            return OperationsOfficerNotificationActionResponseData::success(
                'Notification created successfully.',
                OperationsOfficerNotificationResponseData::fromModel($notification)
            );
        } catch (\Throwable $e) {
            Log::error('Operations officer notification creation failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to create notification.');
        }
    }

    public function markAsRead(string $id): OperationsOfficerNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return OperationsOfficerNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $updated = $this->repository->markAsRead($notification);

            return OperationsOfficerNotificationActionResponseData::success(
                'Notification marked as read.',
                OperationsOfficerNotificationResponseData::fromModel($updated)
            );
        } catch (\Throwable $e) {
            Log::error('Operations officer mark-as-read failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to mark notification as read.');
        }
    }

    public function markAllAsRead(): OperationsOfficerNotificationActionResponseData
    {
        try {
            $count = $this->repository->markAllAsRead();

            return OperationsOfficerNotificationActionResponseData::success(
                'All notifications marked as read.',
                null,
                ['updated_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Operations officer mark-all-as-read failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to mark all notifications as read.');
        }
    }

    public function delete(string $id): OperationsOfficerNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return OperationsOfficerNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $this->repository->delete($notification);
            return OperationsOfficerNotificationActionResponseData::success('Notification deleted successfully.');
        } catch (\Throwable $e) {
            Log::error('Operations officer notification delete failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to delete notification.');
        }
    }

    public function bulkDelete(array $ids): OperationsOfficerNotificationActionResponseData
    {
        try {
            $count = $this->repository->bulkDelete($ids);
            return OperationsOfficerNotificationActionResponseData::success(
                'Notifications deleted successfully.',
                null,
                ['deleted_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Operations officer notification bulk delete failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to delete notifications.');
        }
    }

    public function statistics(): OperationsOfficerNotificationActionResponseData
    {
        try {
            return OperationsOfficerNotificationActionResponseData::success(
                'Notification statistics fetched successfully.',
                null,
                $this->repository->statistics()
            );
        } catch (\Throwable $e) {
            Log::error('Operations officer notification statistics failed', ['error' => $e->getMessage()]);
            return OperationsOfficerNotificationActionResponseData::error('Failed to fetch statistics.');
        }
    }
}
