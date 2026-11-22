<?php

namespace App\Modules\Dispute\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Dispute\DTOs\DisputeRequestData;
use App\Modules\Dispute\Interfaces\DisputeServiceInterface;
use App\Modules\Dispute\Models\DisputeModel;
use App\Modules\Dispute\Rules\DisputeRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisputeController extends Controller
{
    public function __construct(
        private readonly DisputeServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/disputes/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/disputes/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/public/disputes/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(DisputeRule::createRules());

        $response = $this->service->create(
            DisputeRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/disputes/update
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $dispute = DisputeModel::find($request->input('updateId'));
        if (! $dispute) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Dispute not found.',
                'data'    => ['dispute' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(DisputeRule::updateRules($dispute->id));

        $response = $this->service->update(
            $dispute,
            DisputeRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/disputes/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $dispute = DisputeModel::find($request->input('deleteId'));
        if (! $dispute) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Dispute not found.',
                'data'    => ['dispute' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($dispute);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
