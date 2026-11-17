<?php

namespace App\Modules\ApplicantNotification\Interfaces;

use App\Modules\ApplicantNotification\DTOs\ApplicantNotificationActionResponseData;
use App\Modules\ApplicantNotification\DTOs\ApplicantNotificationRequestData;

interface ApplicantNotificationServiceInterface
{
    public function listForApplicant(string $applicantId, array $filters = [], int $perPage = 20): ApplicantNotificationActionResponseData;
    public function recentForApplicant(string $applicantId, int $limit = 6): ApplicantNotificationActionResponseData;
    public function show(int $id): ApplicantNotificationActionResponseData;
    public function create(ApplicantNotificationRequestData $data): ApplicantNotificationActionResponseData;
    public function markAsRead(int $id): ApplicantNotificationActionResponseData;
    public function markAllAsRead(string $applicantId): ApplicantNotificationActionResponseData;
    public function delete(int $id): ApplicantNotificationActionResponseData;
    public function bulkDelete(array $ids): ApplicantNotificationActionResponseData;
    public function statistics(string $applicantId): ApplicantNotificationActionResponseData;
}
