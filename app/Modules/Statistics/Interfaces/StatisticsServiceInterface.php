<?php

namespace App\Modules\Statistics\Interfaces;

use App\Modules\Statistics\DTOs\StatisticsActionResponseData;

interface StatisticsServiceInterface
{
    /** Read-only aggregate counts. */
    public function getStatistics(?string $financeId = null): StatisticsActionResponseData;
}
