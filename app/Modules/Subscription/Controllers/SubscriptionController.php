<?php

namespace App\Modules\Subscription\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Subscription\Interfaces\SubscriptionServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionServiceInterface $service,
    ) {}

    // GET /api/v1/auth/admin/subscriptions/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    // GET /api/v1/auth/admin/subscriptions/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    // GET /api/v1/auth/applicant/subscription
    // (Applicant-scoped — resolves from the authenticated applicant)
    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user instanceof ApplicationModel) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthenticated.',
                'data'    => ['subscription' => null],
                'errors'  => [],
            ], 401);
        }

        $response = $this->service->showForApplicant($user->id);

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }
}
