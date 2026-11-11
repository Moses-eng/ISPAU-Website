<?php

namespace App\Modules\ActivityHistory\Services;

use App\Modules\ActivityHistory\DTOs\ActivityEventResponseData;
use App\Modules\ActivityHistory\DTOs\ActivityFilterRequestData;
use App\Modules\ActivityHistory\DTOs\ActivityListResponseData;
use App\Modules\ActivityHistory\Interfaces\ActivityHistoryServiceInterface;
use App\Modules\ActivityHistory\RepositoryInterfaces\ActivityHistoryRepositoryInterface;
use App\Modules\SystemUser\Models\SystemUserModel;
use Illuminate\Support\Facades\Log;

class ActivityHistoryService implements ActivityHistoryServiceInterface
{
    public function __construct(
        private readonly ActivityHistoryRepositoryInterface $repository,
    ) {}

    /**
     * Role-based area scoping:
     *   - super_admin       → all areas
     *   - finance_admin     → finance + session + overview
     *   - membership_admin  → membership + session + overview
     */
    private function allowedAreasFor(SystemUserModel $viewer): array
    {
        if ($viewer->isSuperAdmin()) {
            return ['membership', 'finance', 'overview', 'reports', 'administration', 'session'];
        }

        if ($viewer->isFinanceAdmin()) {
            return ['finance', 'session', 'overview'];
        }

        if ($viewer->isMembershipAdmin()) {
            return ['membership', 'session', 'overview'];
        }

        return [];
    }

    public function listFor(
        SystemUserModel $viewer,
        ActivityFilterRequestData $filters,
    ): ActivityListResponseData {
        try {
            $areas = $this->allowedAreasFor($viewer);
            if (empty($areas)) {
                return ActivityListResponseData::error('Access denied.');
            }

            $rows = $this->repository->search($filters, $areas);

            $items = $rows
                ->map(fn ($m) => ActivityEventResponseData::fromModel($m)->toArray())
                ->values()
                ->all();

            return ActivityListResponseData::success(
                'Activity history fetched successfully.',
                $items,
                $filters->toArray(),
            );
        } catch (\Throwable $e) {
            Log::error('Activity history fetch failed', [
                'viewer_id' => $viewer->id,
                'error'     => $e->getMessage(),
            ]);
            return ActivityListResponseData::error('Failed to fetch activity history.');
        }
    }

    public function actorsFor(SystemUserModel $viewer): array
    {
        return $this->repository->actors($this->allowedAreasFor($viewer));
    }
}
