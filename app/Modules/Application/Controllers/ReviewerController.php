<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\ReviewerRequestData;
use App\Modules\Application\Interfaces\ReviewerServiceInterface;
use App\Modules\Application\Models\ReviewerModel;
use App\Modules\Application\Rules\ReviewerRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewerController extends Controller
{
    public function __construct(
        private readonly ReviewerServiceInterface $service,
    ) {}


    public function index(string $applicationId): JsonResponse
    {
        $response = $this->service->listByApplication($applicationId);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }


    public function assign(Request $request): JsonResponse
    {
        $request->validate(ReviewerRule::assignRules());


        $assignedBy = $request->input('assigned_by');

        if (! $assignedBy) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unable to resolve assigning admin.',
                'data'    => ['reviewer' => null],
                'errors'  => [],
            ], 422);
        }

        $response = $this->service->assign(
            ReviewerRequestData::fromRequest($request, (string) $assignedBy)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 201 : 400);
    }

    public function withdraw(string $id): JsonResponse
    {
        $reviewer = ReviewerModel::find($id);
        if (! $reviewer) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Reviewer assignment not found.',
                'data'    => ['reviewer' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->withdraw($reviewer);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
}
