<?php

namespace App\Modules\AdminNotification\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\AdminNotification\DTOs\AdminNotificationRequestData;
use App\Modules\AdminNotification\Interfaces\AdminNotificationServiceInterface;
use App\Modules\AdminNotification\Rules\AdminNotificationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationController extends Controller
{
    public function __construct(
        private readonly AdminNotificationServiceInterface $service,
    ) {}

    // GET /api/v1/admin/notifications
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->list(
            $request->all(),
            (int) $request->get('per_page', 20)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/admin/notifications/recent
    public function recent(Request $request): JsonResponse
    {
        $response = $this->service->recent((int) $request->get('limit', 6));
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/admin/notifications/statistics
    public function statistics(): JsonResponse
    {
        $response = $this->service->statistics();
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/admin/notifications/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // POST /api/v1/admin/notifications/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(AdminNotificationRule::createRules());

        $response = $this->service->create(
            AdminNotificationRequestData::fromRequest($request)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 201 : 400);
    }

    // PUT /api/v1/admin/notifications/{id}/read
    public function markAsRead(string $id): JsonResponse
    {
        $response = $this->service->markAsRead($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // PUT /api/v1/admin/notifications/mark-all-read
    public function markAllAsRead(): JsonResponse
    {
        $response = $this->service->markAllAsRead();
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // DELETE /api/v1/admin/notifications/{id}
    public function destroy(string $id): JsonResponse
    {
        $response = $this->service->delete($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // POST /api/v1/admin/notifications/bulk-delete
    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate(AdminNotificationRule::bulkDeleteRules());

        $response = $this->service->bulkDelete($request->input('ids', []));
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
}
