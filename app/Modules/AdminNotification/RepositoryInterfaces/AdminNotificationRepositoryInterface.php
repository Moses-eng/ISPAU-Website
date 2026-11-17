<?php

namespace App\Modules\AdminNotification\RepositoryInterfaces;

use App\Modules\AdminNotification\Models\AdminNotificationModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface AdminNotificationRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 20): LengthAwarePaginator;
    public function recent(int $limit = 6): Collection;
    public function findById(string $id): ?AdminNotificationModel;
    public function create(array $data): AdminNotificationModel;
    public function markAsRead(AdminNotificationModel $notification): AdminNotificationModel;
    public function markAllAsRead(): int;
    public function delete(AdminNotificationModel $notification): bool;
    public function bulkDelete(array $ids): int;
    public function unreadCount(): int;
    public function statistics(): array;
}
