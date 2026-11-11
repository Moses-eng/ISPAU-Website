<?php
use App\Modules\Application\Controllers\ApplicationController;
use App\Modules\Application\Controllers\ClarificationController;
use App\Modules\Application\Controllers\ReviewerController;
use App\Modules\Application\Controllers\VerificationController;
use App\Modules\Application\Controllers\ApplicantAuthController;
use App\Modules\Application\Controllers\ApplicantProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public/applications')
    ->group(function () {
        Route::post('/store', [ApplicationController::class, 'store']);
        Route::post('/draft', [ApplicationController::class, 'saveDraft']);
    });

Route::prefix('v1/auth/admin/applications')
    ->group(function () {
        Route::get   ('/list',      [ApplicationController::class, 'index']);
        Route::get   ('/show/{id}', [ApplicationController::class, 'show']);
        Route::post  ('/update',    [ApplicationController::class, 'update']);
        Route::delete('/delete',    [ApplicationController::class, 'destroy']);
        Route::get   ('/summary-pdf/{id}',      [ApplicationController::class, 'downloadSummaryPdf']);

                // Clarification endpoints
        Route::get ('/{applicationId}/clarifications',        [ClarificationController::class, 'index']);
        Route::post('/clarifications/raise',                  [ClarificationController::class, 'raise']);
        Route::post('/clarifications/{id}/respond',           [ClarificationController::class, 'respond']);
        Route::post('/clarifications/{id}/close',             [ClarificationController::class, 'close']);

                // Reviewer endpoints
        Route::get   ('/{applicationId}/reviewers', [ReviewerController::class, 'index']);
        Route::post  ('/reviewers/assign',          [ReviewerController::class, 'assign']);
        Route::delete('/reviewers/{id}',            [ReviewerController::class, 'withdraw']);


        // Verification endpoints
        Route::get ('/{applicationId}/verifications', [VerificationController::class, 'index']);
        Route::post('/verifications/record',         [VerificationController::class, 'record']);
});




// ---------- Applicant OTP login (public) ----------
Route::prefix('v1/public/applications/auth')->group(function () {
    Route::post('/request-otp', [ApplicantAuthController::class, 'requestOtp']);
    Route::post('/verify-otp',  [ApplicantAuthController::class, 'verifyOtp']);
});

// ---------- Applicant profile (protected) ----------
Route::prefix('v1/auth/applicant')
    ->middleware(['auth:applicants'])
    ->group(function () {
        Route::get ('/profile/show', [ApplicantProfileController::class, 'show']);
        Route::post('/logout',       [ApplicantAuthController::class, 'logout']);
});
