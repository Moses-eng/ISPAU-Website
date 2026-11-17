<?php

namespace App\Modules\MembershipAdminNotification\RepositoryInterfaces;

use App\Modules\MembershipAdminNotification\Models\MembershipAdminNotificationModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface MembershipAdminNotificationRepositoryInterface
{
    public function paginate(array $filters = [], int $perPage = 20): LengthAwarePaginator;
    public function recent(int $limit = 6): Collection;
    public function findById(string $id): ?MembershipAdminNotificationModel;
    public function create(array $data): MembershipAdminNotificationModel;
    public function markAsRead(MembershipAdminNotificationModel $notification): MembershipAdminNotificationModel;
    public function markAllAsRead(): int;
    public function delete(MembershipAdminNotificationModel $notification): bool;
    public function bulkDelete(array $ids): int;
    public function unreadCount(): int;
    public function statistics(): array;
}
