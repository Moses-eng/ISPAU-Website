<?php

namespace App\Modules\OperationsOfficerNotification\Repositories;

use App\Modules\OperationsOfficerNotification\Models\OperationsOfficerNotificationModel;
use App\Modules\OperationsOfficerNotification\RepositoryInterfaces\OperationsOfficerNotificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class OperationsOfficerNotificationRepository implements OperationsOfficerNotificationRepositoryInterface
{
    public function __construct(
        private readonly OperationsOfficerNotificationModel $model,
    ) {}

    public function paginate(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        if (isset($filters['is_read']) && $filters['is_read'] !== '') {
            $query->where('is_read', filter_var($filters['is_read'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['applicant_id'])) {
            $query->where('applicant_id', $filters['applicant_id']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%")
                  ->orWhere('applicant_name', 'like', "%{$search}%")
                  ->orWhere('applicant_email', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('created_at', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('created_at', '<=', $filters['to_date']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function recent(int $limit = 6): Collection
    {
        return $this->model->newQuery()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function findById(string $id): ?OperationsOfficerNotificationModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): OperationsOfficerNotificationModel
    {
        return $this->model->create($data);
    }

    public function markAsRead(OperationsOfficerNotificationModel $notification): OperationsOfficerNotificationModel
    {
        $notification->markAsRead();
        return $notification->fresh();
    }

    public function markAllAsRead(): int
    {
        return $this->model->newQuery()
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    public function delete(OperationsOfficerNotificationModel $notification): bool
    {
        return (bool) $notification->delete();
    }

    public function bulkDelete(array $ids): int
    {
        return $this->model->newQuery()->whereIn('id', $ids)->delete();
    }

    public function unreadCount(): int
    {
        return $this->model->newQuery()->where('is_read', false)->count();
    }

    public function statistics(): array
    {
        $base = $this->model->newQuery();

        $total  = (clone $base)->count();
        $unread = (clone $base)->where('is_read', false)->count();
        $read   = $total - $unread;

        $byType = (clone $base)
            ->selectRaw('type, COUNT(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type')
            ->toArray();

        $byType = array_merge(
            ['info' => 0, 'warning' => 0, 'success' => 0, 'error' => 0],
            $byType
        );

        $last7 = (clone $base)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        return [
            'total'       => $total,
            'unread'      => $unread,
            'read'        => $read,
            'by_type'     => $byType,
            'last_7_days' => $last7,
        ];
    }
}
