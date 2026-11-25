<?php

namespace App\Modules\Activity\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Activity\DTOs\ActivityRequestData;
use App\Modules\Activity\Interfaces\ActivityServiceInterface;
use App\Modules\Activity\Models\ActivityModel;
use App\Modules\Activity\Rules\ActivityRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function __construct(
        private readonly ActivityServiceInterface $service,
    ) {}

    // GET /api/v1/auth/admin/activity/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // GET /api/v1/auth/admin/activity/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // POST /api/v1/auth/admin/activity/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(ActivityRule::createRules());

        $response = $this->service->create(
            ActivityRequestData::fromRequest($request, 'draft'),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // POST /api/v1/auth/admin/activity/update
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $activity = ActivityModel::find($request->input('updateId'));
        if (! $activity) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Activity not found.',
                'data'    => ['activity' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(ActivityRule::updateRules($activity->id));

        $response = $this->service->update(
            $activity,
            ActivityRequestData::fromRequest($request),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // DELETE /api/v1/auth/admin/activity/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $activity = ActivityModel::find($request->input('deleteId'));
        if (! $activity) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Activity not found.',
                'data'    => ['activity' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($activity);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // GET /api/v1/public/activity/list
    public function publicIndex(Request $request): JsonResponse
    {
        $response = $this->service->listPublic($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // GET /api/v1/public/activity/show/{slug}
    public function publicShow(string $slug): JsonResponse
    {
        $response = $this->service->showBySlug($slug);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }
}
