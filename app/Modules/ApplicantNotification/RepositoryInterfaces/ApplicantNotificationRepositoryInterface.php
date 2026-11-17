<?php

namespace App\Modules\ApplicantNotification\RepositoryInterfaces;

use App\Modules\ApplicantNotification\Models\ApplicantNotificationModel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface ApplicantNotificationRepositoryInterface
{
    public function paginateByApplicant(string $applicantId, array $filters = [], int $perPage = 20): LengthAwarePaginator;
    public function recentByApplicant(string $applicantId, int $limit = 6): Collection;
    public function findById(int $id): ?ApplicantNotificationModel;
    public function create(array $data): ApplicantNotificationModel;
    public function markAsRead(ApplicantNotificationModel $notification): ApplicantNotificationModel;
    public function markAllAsRead(string $applicantId): int;
    public function delete(ApplicantNotificationModel $notification): bool;
    public function bulkDelete(array $ids): int;
    public function unreadCount(string $applicantId): int;
    public function statistics(string $applicantId): array;
}
