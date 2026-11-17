<?php

namespace App\Modules\FinanceAdminNotification\RepositoryInterfaces;

use App\Modules\FinanceAdminNotification\Models\FinanceAdminNotificationModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface FinanceAdminNotificationRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 20): LengthAwarePaginator;
    public function recent(int $limit = 6): Collection;
    public function findById(string $id): ?FinanceAdminNotificationModel;
    public function create(array $data): FinanceAdminNotificationModel;
    public function markAsRead(FinanceAdminNotificationModel $notification): FinanceAdminNotificationModel;
    public function markAllAsRead(): int;
    public function delete(FinanceAdminNotificationModel $notification): bool;
    public function bulkDelete(array $ids): int;
    public function unreadCount(): int;
    public function statistics(): array;
}
