<?php

namespace App\Modules\OperationsOfficerNotification\RepositoryInterfaces;

use App\Modules\OperationsOfficerNotification\Models\OperationsOfficerNotificationModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OperationsOfficerNotificationRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 20): LengthAwarePaginator;
    public function recent(int $limit = 6): Collection;
    public function findById(string $id): ?OperationsOfficerNotificationModel;
    public function create(array $data): OperationsOfficerNotificationModel;
    public function markAsRead(OperationsOfficerNotificationModel $notification): OperationsOfficerNotificationModel;
    public function markAllAsRead(): int;
    public function delete(OperationsOfficerNotificationModel $notification): bool;
    public function bulkDelete(array $ids): int;
    public function unreadCount(): int;
    public function statistics(): array;
}
