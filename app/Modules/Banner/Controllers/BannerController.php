<?php

namespace App\Modules\Banner\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Banner\DTOs\BannerRequestData;
use App\Modules\Banner\Interfaces\BannerServiceInterface;
use App\Modules\Banner\Models\BannerModel;
use App\Modules\Banner\Rules\BannerRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function __construct(
        private readonly BannerServiceInterface $service,
    ) {}

    // ==================== PUBLIC LIST ====================
    // GET /api/v1/public/banners/list?page=home
    public function publicIndex(Request $request): JsonResponse
    {
        $page = $request->query('page'); // optional filter
        $response = $this->service->listPublic(is_string($page) ? $page : null);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== ADMIN LIST ====================
    // GET /api/v1/auth/admin/banners/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/banners/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/auth/admin/banners/store  (multipart/form-data)
    public function store(Request $request): JsonResponse
    {
        $request->validate(BannerRule::createRules());

        $response = $this->service->create(
            BannerRequestData::fromRequest($request),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/banners/update  (multipart/form-data)
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $banner = BannerModel::find($request->input('updateId'));
        if (! $banner) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Banner not found.',
                'data'    => ['banner' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(BannerRule::updateRules($banner->id));

        $response = $this->service->update(
            $banner,
            BannerRequestData::fromRequest($request),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/banners/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $banner = BannerModel::find($request->input('deleteId'));
        if (! $banner) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Banner not found.',
                'data'    => ['banner' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($banner);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
