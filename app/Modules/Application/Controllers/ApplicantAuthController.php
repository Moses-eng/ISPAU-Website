<?php

namespace App\Modules\Application\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Application\DTOs\ApplicantOtpRequestData;
use App\Modules\Application\DTOs\ApplicantOtpVerifyData;
use App\Modules\Application\Services\ApplicantAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicantAuthController extends Controller
{
    public function __construct(
        private readonly ApplicantAuthService $authService,
    ) {}

    /** POST /api/v1/public/applications/auth/request-otp */
    public function requestOtp(Request $request): JsonResponse
    {
        $request->validate([
            'businessEmail' => 'required|email|max:255',
        ]);

        $response = $this->authService->requestOtp(
            ApplicantOtpRequestData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    /** POST /api/v1/public/applications/auth/verify-otp */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'businessEmail' => 'required|email|max:255',
            'code'          => 'required|string|size:6',
        ]);

        $response = $this->authService->verifyOtp(
            ApplicantOtpVerifyData::fromRequest($request)
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 401
        );
    }

    /** POST /api/v1/auth/applicant/logout */
    public function logout(Request $request): JsonResponse
    {
        $application = $request->user();  // guard auto-resolved
        $response = $this->authService->logout($application);
        return response()->json($response->toArray(), $response->isSuccess() ? 200 : 400);
    }
}
