<?php

namespace App\Modules\Statistics\Services;

use App\Modules\Statistics\DTOs\StatisticsActionResponseData;
use App\Modules\Statistics\DTOs\StatisticsResponseData;
use App\Modules\Statistics\Interfaces\StatisticsServiceInterface;
use App\Modules\Statistics\RepositoryInterfaces\StatisticsRepositoryInterface;
use Illuminate\Support\Facades\Log;

class StatisticsService implements StatisticsServiceInterface
{
    public function __construct(
        private readonly StatisticsRepositoryInterface $repository,
    ) {}

    public function getStatistics(?string $financeId = null): StatisticsActionResponseData
    {
        try {
            $statistics = new StatisticsResponseData(
                finance:    $this->repository->countFinance($financeId),
                applicants: $this->repository->countApplicants(),
                other:      $this->repository->countOther(),
            );

            return StatisticsActionResponseData::success(
                'Statistics fetched successfully.',
                $statistics,
            );
        } catch (\Throwable $e) {
            Log::error('Statistics fetch failed', [
                'error'      => $e->getMessage(),
                'finance_id' => $financeId,
            ]);
            return StatisticsActionResponseData::error('Failed to fetch statistics.');
        }
    }
}
