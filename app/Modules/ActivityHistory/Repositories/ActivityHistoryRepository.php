<?php

namespace App\Modules\ActivityHistory\Repositories;

use App\Modules\ActivityHistory\DTOs\ActivityFilterRequestData;
use App\Modules\ActivityHistory\Models\AuditEventModel;
use App\Modules\ActivityHistory\RepositoryInterfaces\ActivityHistoryRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ActivityHistoryRepository implements ActivityHistoryRepositoryInterface
{
    public function __construct(private readonly AuditEventModel $model) {}

    public function search(ActivityFilterRequestData $f, array $allowedAreas): Collection
    {
        $q = $this->model->newQuery();

        // Scope by areas the caller is allowed to see
        if (! empty($allowedAreas)) {
            $q->whereIn('area', $allowedAreas);
        }

        if (! empty($f->area)) {
            $q->where('area', $f->area);
        }

        if (! empty($f->person)) {
            $q->where('actor_id', $f->person);
        }

        if (! empty($f->kind)) {
            $q->where('kind', $f->kind);
        }

        if (! empty($f->from)) {
            $q->whereDate('occurred_at', '>=', $f->from);
        }

        if (! empty($f->to)) {
            $q->whereDate('occurred_at', '<=', $f->to);
        }

        if (! empty($f->query)) {
            $term = '%' . trim($f->query) . '%';
            $q->where(function ($w) use ($term) {
                $w->where('actor_name', 'like', $term)
                ->orWhere('summary', 'like', $term)
                ->orWhere('organisation', 'like', $term)
                ->orWhere('record_id', 'like', $term)
                ->orWhere('filename', 'like', $term);
            });
        }

        $sort  = in_array($f->sort, ['occurred_at', 'actor_name', 'area', 'kind'], true)
            ? $f->sort : 'occurred_at';
        $order = $f->order === 'asc' ? 'asc' : 'desc';

        return $q->orderBy($sort, $order)
                ->limit(max(1, min($f->perPage, 500)))
                ->get();
    }

    public function actors(array $allowedAreas): array
    {
        $q = $this->model->newQuery();
        if (! empty($allowedAreas)) {
            $q->whereIn('area', $allowedAreas);
        }

        return $q->select('actor_id', 'actor_name')
                ->distinct()
                ->orderBy('actor_name')
                ->get()
                ->map(fn ($row) => ['id' => $row->actor_id, 'name' => $row->actor_name])
                ->all();
    }
}
