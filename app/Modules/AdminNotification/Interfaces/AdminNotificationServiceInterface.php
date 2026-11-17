<?php

namespace App\Modules\AdminNotification\Interfaces;

use App\Modules\AdminNotification\DTOs\AdminNotificationActionResponseData;
use App\Modules\AdminNotification\DTOs\AdminNotificationRequestData;

interface AdminNotificationServiceInterface
{
    public function list(array $filters = [], int $perPage = 20): AdminNotificationActionResponseData;
    public function recent(int $limit = 6): AdminNotificationActionResponseData;
    public function show(string $id): AdminNotificationActionResponseData;
    public function create(AdminNotificationRequestData $data): AdminNotificationActionResponseData;
    public function markAsRead(string $id): AdminNotificationActionResponseData;
    public function markAllAsRead(): AdminNotificationActionResponseData;
    public function delete(string $id): AdminNotificationActionResponseData;
    public function bulkDelete(array $ids): AdminNotificationActionResponseData;
    public function statistics(): AdminNotificationActionResponseData;
}
