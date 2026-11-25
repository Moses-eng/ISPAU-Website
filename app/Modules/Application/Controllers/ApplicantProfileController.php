<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\ApplicationRequestData;
use App\Modules\Application\Rules\ApplicationRule;
use App\Modules\Application\Services\ApplicantProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicantProfileController extends Controller
{
    public function __construct(
        private readonly ApplicantProfileService $profileService,
    ) {}

    /** GET /api/v1/auth/applicant/profile/show/{id} */
    public function show(Request $request, string $id): JsonResponse
    {
        $response = $this->profileService->show($request->user(), $id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }
/** POST /api/v1/auth/applicant/profile/update */
    public function update(Request $request): JsonResponse
    {
        $application = $request->user();
        // Validate only fields editable by applicant, ignoring self on unique email checks
        $validated = $request->validate(ApplicationRule::applicantUpdateRules($application->id));
        $response = $this->profileService->update($application, $validated);
        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
}
