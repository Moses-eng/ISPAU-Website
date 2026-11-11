<?php

namespace App\Modules\StaffHistory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\StaffHistory\Interfaces\StaffHistoryServiceInterface;
use App\Modules\SystemUser\Models\SystemUserModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffHistoryController extends Controller
{
    public function __construct(
        private readonly StaffHistoryServiceInterface $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        /** @var SystemUserModel $viewer */
        $viewer = auth('system_users')->user();

        $res = $this->service->listFor(
            viewer: $viewer,
            person: $request->input('person'),
            from:   $request->input('from'),
            to:     $request->input('to'),
            limit:  (int) $request->input('limit', 100),
        );

        return response()->json($res->toArray(), $res->isSuccess() ? 200 : 403);
    }
}
