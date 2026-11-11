<?php

namespace App\Modules\StaffHistory\Repositories;

use App\Modules\ActivityHistory\Models\AuditEventModel;
use App\Modules\StaffHistory\RepositoryInterfaces\StaffHistoryRepositoryInterface;
use Illuminate\Support\Collection;

class StaffHistoryRepository implements StaffHistoryRepositoryInterface
{
    public function __construct(private readonly AuditEventModel $model) {}

    public function sessions(array $actorIds, ?string $from, ?string $to, int $limit): Collection
    {
        $q = $this->model->newQuery();

        if (! empty($actorIds)) {
            $q->whereIn('actor_id', $actorIds);
        }

        if (! empty($from)) {
            $q->whereDate('occurred_at', '>=', $from);
        }

        if (! empty($to)) {
            $q->whereDate('occurred_at', '<=', $to);
        }

        $rows = $q->orderBy('occurred_at', 'desc')
                  ->limit(max(1, min($limit, 5000)))
                  ->get();

        return $rows->groupBy('session_id');
    }
}
