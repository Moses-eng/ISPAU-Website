<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\ApplicationRequestData;
use App\Modules\Application\Interfaces\ApplicationServiceInterface;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Application\Rules\ApplicationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(
        private readonly ApplicationServiceInterface $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 404);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(ApplicationRule::createRules());

        $response = $this->service->create(
            ApplicationRequestData::fromRequest($request, 'Submitted')
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 201 : 400);
    }

    // POST /api/v1/public/applications/draft
    public function saveDraft(Request $request): JsonResponse
    {
        $request->validate(ApplicationRule::draftRules());

        $response = $this->service->saveDraft(
            ApplicationRequestData::fromRequest($request, 'Draft')
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $application = ApplicationModel::find($request->input('updateId'));
        if (! $application) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Application not found.',
                'data'    => ['application' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(ApplicationRule::updateRules($application->id));

        $response = $this->service->update(
            $application,
            ApplicationRequestData::fromRequest($request, $application->status)
        );

        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
    public function downloadSummaryPdf(string $id)
    {
        return $this->service->downloadSummaryPdf($id);
    }
        public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $application = ApplicationModel::find($request->input('deleteId'));
        if (! $application) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Application not found.',
                'data'    => ['application' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($application);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
}
