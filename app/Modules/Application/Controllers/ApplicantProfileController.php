<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\ApplicationResponseData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicantProfileController extends Controller
{
    /** GET /api/v1/auth/applicant/profile/show */
    public function show(Request $request): JsonResponse
    {
        $application = $request->user();
        return response()->json([
            'status'  => 'success',
            'message' => 'Application fetched successfully.',
            'data'    => [
                'application' => ApplicationResponseData::fromModel($application)->toArray(),
            ],
            'errors'  => [],
        ]);
    }
}
