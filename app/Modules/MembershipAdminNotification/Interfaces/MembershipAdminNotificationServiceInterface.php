<?php

namespace App\Modules\MembershipAdminNotification\Interfaces;

use App\Modules\MembershipAdminNotification\DTOs\MembershipAdminNotificationActionResponseData;
use App\Modules\MembershipAdminNotification\DTOs\MembershipAdminNotificationRequestData;

interface MembershipAdminNotificationServiceInterface
{
    public function list(array $filters = [], int $perPage = 20): MembershipAdminNotificationActionResponseData;
    public function recent(int $limit = 6): MembershipAdminNotificationActionResponseData;
    public function show(string $id): MembershipAdminNotificationActionResponseData;
    public function create(MembershipAdminNotificationRequestData $data): MembershipAdminNotificationActionResponseData;
    public function markAsRead(string $id): MembershipAdminNotificationActionResponseData;
    public function markAllAsRead(): MembershipAdminNotificationActionResponseData;
    public function delete(string $id): MembershipAdminNotificationActionResponseData;
    public function bulkDelete(array $ids): MembershipAdminNotificationActionResponseData;
    public function statistics(): MembershipAdminNotificationActionResponseData;
}
