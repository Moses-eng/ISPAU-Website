<?php

namespace App\Modules\MembershipAdminNotification\Services;

use App\Modules\MembershipAdminNotification\DTOs\MembershipAdminNotificationActionResponseData;
use App\Modules\MembershipAdminNotification\DTOs\MembershipAdminNotificationRequestData;
use App\Modules\MembershipAdminNotification\DTOs\MembershipAdminNotificationResponseData;
use App\Modules\MembershipAdminNotification\Interfaces\MembershipAdminNotificationServiceInterface;
use App\Modules\MembershipAdminNotification\Models\MembershipAdminNotificationModel;
use App\Modules\MembershipAdminNotification\RepositoryInterfaces\MembershipAdminNotificationRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MembershipAdminNotificationService implements MembershipAdminNotificationServiceInterface
{
    public function __construct(
        private readonly MembershipAdminNotificationRepositoryInterface $repository,
    ) {}

    public function list(array $filters = [], int $perPage = 20): MembershipAdminNotificationActionResponseData
    {
        try {
            $paginator = $this->repository->paginate($filters, $perPage);

            $items = collect($paginator->items())
                ->map(fn (MembershipAdminNotificationModel $m) => MembershipAdminNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return MembershipAdminNotificationActionResponseData::success(
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
            Log::error('Membership admin notification list failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to fetch notifications.');
        }
    }

    public function recent(int $limit = 6): MembershipAdminNotificationActionResponseData
    {
        try {
            $items = $this->repository->recent($limit)
                ->map(fn (MembershipAdminNotificationModel $m) => MembershipAdminNotificationResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return MembershipAdminNotificationActionResponseData::success(
                'Recent notifications fetched successfully.',
                null,
                [
                    'items'        => $items,
                    'unread_count' => $this->repository->unreadCount(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Membership admin recent notifications failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to fetch recent notifications.');
        }
    }

    public function show(string $id): MembershipAdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return MembershipAdminNotificationActionResponseData::error('Notification not found.');
        }

        return MembershipAdminNotificationActionResponseData::success(
            'Notification fetched successfully.',
            MembershipAdminNotificationResponseData::fromModel($notification)
        );
    }

    public function create(MembershipAdminNotificationRequestData $data): MembershipAdminNotificationActionResponseData
    {
        if (! $data->applicant_id) {
            throw ValidationException::withMessages([
                'applicant_id' => ['Applicant ID is required.'],
            ]);
        }

        try {
            $notification = $this->repository->create($data->toArray());

            return MembershipAdminNotificationActionResponseData::success(
                'Notification created successfully.',
                MembershipAdminNotificationResponseData::fromModel($notification)
            );
        } catch (\Throwable $e) {
            Log::error('Membership admin notification creation failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to create notification.');
        }
    }

    public function markAsRead(string $id): MembershipAdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return MembershipAdminNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $updated = $this->repository->markAsRead($notification);

            return MembershipAdminNotificationActionResponseData::success(
                'Notification marked as read.',
                MembershipAdminNotificationResponseData::fromModel($updated)
            );
        } catch (\Throwable $e) {
            Log::error('Membership admin mark-as-read failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to mark notification as read.');
        }
    }

    public function markAllAsRead(): MembershipAdminNotificationActionResponseData
    {
        try {
            $count = $this->repository->markAllAsRead();

            return MembershipAdminNotificationActionResponseData::success(
                'All notifications marked as read.',
                null,
                ['updated_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Membership admin mark-all-as-read failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to mark all notifications as read.');
        }
    }

    public function delete(string $id): MembershipAdminNotificationActionResponseData
    {
        $notification = $this->repository->findById($id);
        if (! $notification) {
            return MembershipAdminNotificationActionResponseData::error('Notification not found.');
        }

        try {
            $this->repository->delete($notification);
            return MembershipAdminNotificationActionResponseData::success('Notification deleted successfully.');
        } catch (\Throwable $e) {
            Log::error('Membership admin notification delete failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to delete notification.');
        }
    }

    public function bulkDelete(array $ids): MembershipAdminNotificationActionResponseData
    {
        try {
            $count = $this->repository->bulkDelete($ids);
            return MembershipAdminNotificationActionResponseData::success(
                'Notifications deleted successfully.',
                null,
                ['deleted_count' => $count]
            );
        } catch (\Throwable $e) {
            Log::error('Membership admin notification bulk delete failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to delete notifications.');
        }
    }

    public function statistics(): MembershipAdminNotificationActionResponseData
    {
        try {
            return MembershipAdminNotificationActionResponseData::success(
                'Notification statistics fetched successfully.',
                null,
                $this->repository->statistics()
            );
        } catch (\Throwable $e) {
            Log::error('Membership admin notification statistics failed', ['error' => $e->getMessage()]);
            return MembershipAdminNotificationActionResponseData::error('Failed to fetch statistics.');
        }
    }
}
