<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\VerificationRequestData;
use App\Modules\Application\Interfaces\VerificationServiceInterface;
use App\Modules\Application\Rules\VerificationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function __construct(
        private readonly VerificationServiceInterface $service,
    ) {}

    public function index(string $applicationId): JsonResponse
    {
        $response = $this->service->listByApplication($applicationId);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }


    public function record(Request $request): JsonResponse
    {
        $request->validate(VerificationRule::recordRules());

        $assignedBy = $request->input('assigned_by');

        if (! $assignedBy) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unable to resolve the verifying admin.',
                'data'    => ['verification' => null],
                'errors'  => [],
            ], 422);
        }

        $response = $this->service->record(
            VerificationRequestData::fromRequest($request, (string) $assignedBy)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 201 : 400);
    }
}
