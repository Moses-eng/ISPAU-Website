<?php

namespace App\Modules\OperationsOfficerNotification\Interfaces;

use App\Modules\OperationsOfficerNotification\DTOs\OperationsOfficerNotificationActionResponseData;
use App\Modules\OperationsOfficerNotification\DTOs\OperationsOfficerNotificationRequestData;

interface OperationsOfficerNotificationServiceInterface
{
    public function list(array $filters = [], int $perPage = 20): OperationsOfficerNotificationActionResponseData;
    public function recent(int $limit = 6): OperationsOfficerNotificationActionResponseData;
    public function show(string $id): OperationsOfficerNotificationActionResponseData;
    public function create(OperationsOfficerNotificationRequestData $data): OperationsOfficerNotificationActionResponseData;
    public function markAsRead(string $id): OperationsOfficerNotificationActionResponseData;
    public function markAllAsRead(): OperationsOfficerNotificationActionResponseData;
    public function delete(string $id): OperationsOfficerNotificationActionResponseData;
    public function bulkDelete(array $ids): OperationsOfficerNotificationActionResponseData;
    public function statistics(): OperationsOfficerNotificationActionResponseData;
}
