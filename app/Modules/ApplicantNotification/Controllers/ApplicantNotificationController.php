<?php

namespace App\Modules\ApplicantNotification\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ApplicantNotification\DTOs\ApplicantNotificationRequestData;
use App\Modules\ApplicantNotification\Interfaces\ApplicantNotificationServiceInterface;
use App\Modules\ApplicantNotification\Rules\ApplicantNotificationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicantNotificationController extends Controller
{
    public function __construct(
        private readonly ApplicantNotificationServiceInterface $service,
    ) {}

    // GET /api/v1/applicant/notifications/list/{applicantId}
    public function index(Request $request, string $applicantId): JsonResponse
    {
        if (! $applicantId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Applicant ID is required.',
                'data'    => ['notification' => null],
                'errors'  => [],
            ], 400);
        }

        $response = $this->service->listForApplicant(
            $applicantId,
            $request->all(),
            (int) $request->get('per_page', 20)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/applicant/notifications/recent/{applicantId}
    public function recent(Request $request, string $applicantId): JsonResponse
    {
        if (! $applicantId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Applicant ID is required.',
                'data'    => ['notification' => null],
                'errors'  => [],
            ], 400);
        }

        $response = $this->service->recentForApplicant(
            $applicantId,
            (int) $request->get('limit', 6)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/applicant/notifications/statistics/{applicantId}
    public function statistics(Request $request, string $applicantId): JsonResponse
    {
        if (! $applicantId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Applicant ID is required.',
                'data'    => ['notification' => null],
                'errors'  => [],
            ], 400);
        }

        $response = $this->service->statistics($applicantId);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/applicant/notifications/{id}
    public function show(int $id): JsonResponse
    {
        $response = $this->service->show($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // POST /api/v1/applicant/notifications/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(ApplicantNotificationRule::createRules());

        $response = $this->service->create(
            ApplicantNotificationRequestData::fromRequest($request)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 201 : 400);
    }

    // PUT /api/v1/applicant/notifications/{id}/read
    public function markAsRead(int $id): JsonResponse
    {
        $response = $this->service->markAsRead($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // PUT /api/v1/applicant/notifications/mark-all-read/{applicantId}
    public function markAllAsRead(Request $request, string $applicantId): JsonResponse
    {
        if (! $applicantId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Applicant ID is required.',
                'data'    => ['notification' => null],
                'errors'  => [],
            ], 400);
        }

        $response = $this->service->markAllAsRead($applicantId);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // DELETE /api/v1/applicant/notifications/{id}
    public function destroy(int $id): JsonResponse
    {
        $response = $this->service->delete($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // POST /api/v1/applicant/notifications/bulk-delete
    public function bulkDelete(Request $request): JsonResponse
    {
        $request->validate(ApplicantNotificationRule::bulkDeleteRules());

        $response = $this->service->bulkDelete($request->input('ids', []));
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
}
