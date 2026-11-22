<?php

namespace App\Modules\Statistics\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Statistics\Interfaces\StatisticsServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatisticsController extends Controller
{
    public function __construct(
        private readonly StatisticsServiceInterface $service,
    ) {}

    // ==================== STATS ====================
    // GET /api/v1/auth/admin/statistics
    // Optional query: ?finance_id=<uuid>
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->getStatistics(
            $request->query('finance_id')
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== BADGES ====================
    // GET /api/v1/auth/admin/statistics/badges
    public function badges(Request $request): JsonResponse
    {
        $response = $this->service->getStatistics(
            $request->query('finance_id')
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
