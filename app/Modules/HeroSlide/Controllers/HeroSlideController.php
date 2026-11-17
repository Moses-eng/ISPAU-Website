<?php

namespace App\Modules\HeroSlide\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HeroSlide\DTOs\HeroSlideRequestData;
use App\Modules\HeroSlide\Interfaces\HeroSlideServiceInterface;
use App\Modules\HeroSlide\Models\HeroSlideModel;
use App\Modules\HeroSlide\Rules\HeroSlideRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeroSlideController extends Controller
{
    public function __construct(
        private readonly HeroSlideServiceInterface $service,
    ) {}

    // ==================== PUBLIC LIST ====================
    // GET /api/v1/public/hero-slides/list
    public function publicIndex(): JsonResponse
    {
        $response = $this->service->listPublic();

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== ADMIN LIST ====================
    // GET /api/v1/auth/admin/hero-slides/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== SHOW ====================
    // GET /api/v1/auth/admin/hero-slides/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // ==================== STORE ====================
    // POST /api/v1/auth/admin/hero-slides/store  (multipart/form-data)
    public function store(Request $request): JsonResponse
    {
        $request->validate(HeroSlideRule::createRules());

        $response = $this->service->create(
            HeroSlideRequestData::fromRequest($request),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // ==================== UPDATE ====================
    // POST /api/v1/auth/admin/hero-slides/update  (multipart/form-data)
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $slide = HeroSlideModel::find($request->input('updateId'));
        if (! $slide) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Hero slide not found.',
                'data'    => ['slide' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(HeroSlideRule::updateRules($slide->id));

        $response = $this->service->update(
            $slide,
            HeroSlideRequestData::fromRequest($request),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // ==================== DELETE ====================
    // DELETE /api/v1/auth/admin/hero-slides/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $slide = HeroSlideModel::find($request->input('deleteId'));
        if (! $slide) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Hero slide not found.',
                'data'    => ['slide' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($slide);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
