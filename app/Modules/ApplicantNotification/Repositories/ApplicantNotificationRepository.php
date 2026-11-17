<?php

namespace App\Modules\ApplicantNotification\Repositories;

use App\Modules\ApplicantNotification\Models\ApplicantNotificationModel;
use App\Modules\ApplicantNotification\RepositoryInterfaces\ApplicantNotificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ApplicantNotificationRepository implements ApplicantNotificationRepositoryInterface
{
    public function __construct(private readonly ApplicantNotificationModel $model) {}

    public function paginateByApplicant(string $applicantId, array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->model->newQuery()->where('applicant_id', $applicantId);

        if (isset($filters['is_read']) && $filters['is_read'] !== '') {
            $query->where('is_read', filter_var($filters['is_read'], FILTER_VALIDATE_BOOLEAN));
        }
        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }
        if (! empty($filters['search'])) {
            $s = trim((string) $filters['search']);
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('message', 'like', "%{$s}%");
            });
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function recentByApplicant(string $applicantId, int $limit = 6): Collection
    {
        return $this->model->newQuery()
            ->where('applicant_id', $applicantId)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function findById(int $id): ?ApplicantNotificationModel
    {
        return $this->model->newQuery()->find($id);
    }

    public function create(array $data): ApplicantNotificationModel
    {
        return $this->model->create($data);
    }

    public function markAsRead(ApplicantNotificationModel $notification): ApplicantNotificationModel
    {
        $notification->markAsRead();
        return $notification->fresh();
    }

    public function markAllAsRead(string $applicantId): int
    {
        return $this->model->newQuery()
            ->where('applicant_id', $applicantId)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
    }

    public function delete(ApplicantNotificationModel $notification): bool
    {
        return (bool) $notification->delete();
    }

    public function bulkDelete(array $ids): int
    {
        return $this->model->newQuery()->whereIn('id', $ids)->delete();
    }

    public function unreadCount(string $applicantId): int
    {
        return $this->model->newQuery()
            ->where('applicant_id', $applicantId)
            ->where('is_read', false)
            ->count();
    }

    public function statistics(string $applicantId): array
    {
        $base = $this->model->newQuery()->where('applicant_id', $applicantId);

        return [
            'total'       => (clone $base)->count(),
            'unread'      => (clone $base)->where('is_read', false)->count(),
            'read'        => (clone $base)->where('is_read', true)->count(),
            'by_type'     => [
                'info'    => (clone $base)->where('type', 'info')->count(),
                'warning' => (clone $base)->where('type', 'warning')->count(),
                'success' => (clone $base)->where('type', 'success')->count(),
                'error'   => (clone $base)->where('type', 'error')->count(),
            ],
            'last_7_days' => (clone $base)->where('created_at', '>=', now()->subDays(7))->count(),
        ];
    }
}
