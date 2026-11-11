<?php

namespace App\Modules\ActivityHistory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ActivityHistory\DTOs\ActivityFilterRequestData;
use App\Modules\ActivityHistory\Interfaces\ActivityHistoryServiceInterface;
use App\Modules\SystemUser\Models\SystemUserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityHistoryController extends Controller
{
    public function __construct(
        private readonly ActivityHistoryServiceInterface $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        /** @var SystemUserModel $viewer */
        $viewer = auth('system_users')->user();

        $res = $this->service->listFor(
            $viewer,
            ActivityFilterRequestData::fromRequest($request),
        );

        return response()->json($res->toArray(), $res->isSuccess() ? 200 : 403);
    }

    public function actors(): JsonResponse
    {
        /** @var SystemUserModel $viewer */
        $viewer = auth('system_users')->user();

        return response()->json([
            'status'  => 'success',
            'message' => 'Actors fetched.',
            'data'    => ['items' => $this->service->actorsFor($viewer)],
            'errors'  => [],
        ]);
    }
}
