<?php

namespace App\Modules\Tier\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tier\DTOs\TierRequestData;
use App\Modules\Tier\Interfaces\TierServiceInterface;
use App\Modules\Tier\Models\TierModel;
use App\Modules\Tier\Rules\TierRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TierController extends Controller
{
    public function __construct(
        private readonly TierServiceInterface $service,
    ) {}

    // ==================== LIST ====================
    // GET /api/v1/auth/admin/tiers/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/tiers/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/public/tiers/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(TierRule::createRules());

        $response = $this->service->create(
            TierRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/tiers/update
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $tier = TierModel::find($request->input('updateId'));
        if (! $tier) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tier not found.',
                'data'    => ['tier' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(TierRule::updateRules($tier->id));

        $response = $this->service->update(
            $tier,
            TierRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/tiers/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $tier = TierModel::find($request->input('deleteId'));
        if (! $tier) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Tier not found.',
                'data'    => ['tier' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($tier);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== PUBLIC LIST ====================
    // GET /api/v1/public/tiers/list
    // Returns only id, name, cost, description for active tiers.
    public function publicIndex(): JsonResponse
    {
        $response = $this->service->listPublic();

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
