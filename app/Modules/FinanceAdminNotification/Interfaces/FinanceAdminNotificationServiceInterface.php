<?php

namespace App\Modules\FinanceAdminNotification\Interfaces;

use App\Modules\FinanceAdminNotification\DTOs\FinanceAdminNotificationActionResponseData;
use App\Modules\FinanceAdminNotification\DTOs\FinanceAdminNotificationRequestData;

interface FinanceAdminNotificationServiceInterface
{
    public function list(array $filters = [], int $perPage = 20): FinanceAdminNotificationActionResponseData;
    public function recent(int $limit = 6): FinanceAdminNotificationActionResponseData;
    public function show(string $id): FinanceAdminNotificationActionResponseData;
    public function create(FinanceAdminNotificationRequestData $data): FinanceAdminNotificationActionResponseData;
    public function markAsRead(string $id): FinanceAdminNotificationActionResponseData;
    public function markAllAsRead(): FinanceAdminNotificationActionResponseData;
    public function delete(string $id): FinanceAdminNotificationActionResponseData;
    public function bulkDelete(array $ids): FinanceAdminNotificationActionResponseData;
    public function statistics(): FinanceAdminNotificationActionResponseData;
}
