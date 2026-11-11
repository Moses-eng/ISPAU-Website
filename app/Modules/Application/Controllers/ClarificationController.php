<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\ClarificationRequestData;
use App\Modules\Application\Interfaces\ClarificationServiceInterface;
use App\Modules\Application\Models\ClarificationModel;
use App\Modules\Application\Rules\ClarificationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClarificationController extends Controller
{
    public function __construct(
        private readonly ClarificationServiceInterface $service,
    ) {}


    public function index(string $applicationId): JsonResponse
    {
        $response = $this->service->listByApplication($applicationId);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }


    public function raise(Request $request): JsonResponse
    {
        $request->validate(ClarificationRule::raiseRules());

        $assignedBy = $request->input('assigned_by');

        if (! $assignedBy) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unable to resolve the issuing admin.',
                'data'    => ['clarification' => null],
                'errors'  => [],
            ], 422);
        }

        $response = $this->service->raise(
            ClarificationRequestData::fromRequest($request, (string) $assignedBy)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 201 : 400);
    }


    public function respond(Request $request, string $id): JsonResponse
    {
        $request->validate(ClarificationRule::respondRules());

        $clarification = ClarificationModel::find($id);
        if (! $clarification) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Clarification not found.',
                'data'    => ['clarification' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->respond(
            $clarification,
            (string) $request->input('response'),
            (string) $request->input('status', 'Responded'),
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }


    public function close(Request $request, string $id): JsonResponse
    {
        $request->validate(ClarificationRule::closeRules());

        $clarification = ClarificationModel::find($id);
        if (! $clarification) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Clarification not found.',
                'data'    => ['clarification' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->close(
            $clarification,
            (string) $request->input('status', 'Closed'),
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
}
