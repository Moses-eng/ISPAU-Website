<?php

namespace App\Modules\Statistics\Repositories;

use App\Modules\Statistics\Models\StatisticsModel;
use App\Modules\Statistics\RepositoryInterfaces\StatisticsRepositoryInterface;
use Illuminate\Support\Facades\DB;

class StatisticsRepository implements StatisticsRepositoryInterface
{
    public function countFinance(?string $financeId = null): int
    {
        $query = DB::table('invoices');

        if ($financeId) {
            $query->where('confirmed_by', $financeId);
        }

        return (int) $query->count();
    }

    public function countApplicants(): int
    {
        return (int) DB::table('applications')
            ->whereNotIn('status', StatisticsModel::NON_DRAFT_EXCLUDED_STATUSES)
            ->count();
    }

    public function countOther(): int
    {
        return 0;
    }
}
