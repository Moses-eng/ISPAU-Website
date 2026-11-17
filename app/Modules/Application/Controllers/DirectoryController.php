<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\Services\DirectoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectoryController extends Controller
{
    public function __construct(
        private readonly DirectoryService $directoryService,
    ) {}

    /**
     * Public list of published, active members.
     * GET /api/v1/public/directory/list
     */
    public function index(Request $request): JsonResponse
    {
        $response = $this->directoryService->list(
            $request->only(['search', 'service', 'coverage'])
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 500
        );
    }

    /**
     * Public show single member by ID or slug.
     * GET /api/v1/public/directory/show/{id}
     */
    public function show(string $id): JsonResponse
    {
        $response = $this->directoryService->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }
}
