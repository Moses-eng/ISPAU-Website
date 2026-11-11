<?php

namespace App\Modules\Application\Services;

use App\Modules\Application\DTOs\ApplicantLoginResponseData;
use App\Modules\Application\DTOs\ApplicantOtpRequestData;
use App\Modules\Application\DTOs\ApplicantOtpVerifyData;
use App\Modules\Application\DTOs\ApplicationResponseData;
use App\Mail\ApplicantOtpMail;
use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;

class ApplicantAuthService
{
    // ─────────────────────── REQUEST OTP ───────────────────────
    public function requestOtp(ApplicantOtpRequestData $data): ApplicantLoginResponseData
    {
        $application = $this->findByEmail($data->email);

        // Never reveal whether the email exists — generic response
        if (! $application) {
            Log::warning('Applicant OTP requested for unknown email', ['email' => $data->email]);
            return ApplicantLoginResponseData::error(
                'If this email belongs to a submitted application, you will receive a code shortly.'
            );
        }

        // Only submitted applications can log in — drafts cannot
        if ($application->isDraft()) {
            return ApplicantLoginResponseData::error(
                'This application has not been submitted yet.'
            );
        }
        if ($application->isDeclined()) {
            return ApplicantLoginResponseData::error(
                'This application is no longer active. Please contact ISPAU.'
            );
        }

        $cooldown = (int) config('applicant_otp.resend_cooldown_seconds', 60);
        $wait     = $application->resendCooldownRemaining($cooldown);
        if ($wait > 0) {
            return ApplicantLoginResponseData::error(
                "Please wait {$wait} seconds before requesting another code.",
                payload: ['retry_after' => $wait]
            );
        }

        $ttl  = (int) config('applicant_otp.ttl_minutes', 10);
        $code = $application->generateOtp($ttl);

        try {
            Mail::to($application->business_email)->send(
                new ApplicantOtpMail(
                    code:             $code,
                    applicantName:    $application->applicant_name ?: 'Applicant',
                    organisationName: $application->legal_name ?: 'your organisation',
                    ttlMinutes:       $ttl,
                )
            );
        } catch (\Throwable $e) {
            Log::error('Applicant OTP email failed', [
                'application_id' => $application->id,
                'error'          => $e->getMessage(),
            ]);
            // Don't leak failure details to the caller
            return ApplicantLoginResponseData::error(
                'We could not send the code right now. Please try again shortly.'
            );
        }

        if (app()->environment('local')) {
            Log::info('Applicant OTP issued (local only)', [
                'application_id' => $application->id,
                'email'          => $application->business_email,
                'code'           => $code,
            ]);
        }

        return ApplicantLoginResponseData::success(
            message: "A login code has been sent to {$this->maskEmail($application->business_email)}.",
            payload: [
                'expires_in_minutes' => $ttl,
                'resend_after'       => $cooldown,
            ],
        );
    }

    // ─────────────────────── VERIFY OTP ───────────────────────
    public function verifyOtp(ApplicantOtpVerifyData $data): ApplicantLoginResponseData
    {
        $application = $this->findByEmail($data->email);

        if (! $application) {
            return ApplicantLoginResponseData::error('Invalid email or code.');
        }

        if ($application->isDraft() || $application->isDeclined()) {
            return ApplicantLoginResponseData::error('This application is not available for login.');
        }

        $testCode = config('applicant_otp.test_code');
        $isTest   = $testCode && hash_equals((string) $testCode, $data->code);

        if (! $isTest) {
            if (! $application->otp_code_hash) {
                return ApplicantLoginResponseData::error('No code was requested for this email.');
            }
            if ($application->otpExpired()) {
                $application->clearOtp();
                return ApplicantLoginResponseData::error('The code has expired. Please request a new one.');
            }

            $max = (int) config('applicant_otp.max_attempts', 5);
            if ($application->otp_attempts >= $max) {
                $application->clearOtp();
                return ApplicantLoginResponseData::error(
                    'Too many incorrect attempts. Please request a new code.'
                );
            }

            if (! $application->otpMatches($data->code)) {
                $application->incrementOtpAttempts();
                $remaining = $max - $application->otp_attempts;
                return ApplicantLoginResponseData::error(
                    'Invalid code.',
                    payload: ['attempts_remaining' => max(0, $remaining)]
                );
            }
        }

        try {
            $token = Auth::guard(config('applicant_otp.guard', 'applicants'))
                ->login($application);
        } catch (JWTException $e) {
            Log::error('Applicant JWT issue failed', ['error' => $e->getMessage()]);
            return ApplicantLoginResponseData::error('Could not create token.');
        }

        $application->recordLogin(request()->ip());

        Log::info('Applicant logged in', [
            'application_id' => $application->id,
            'email'          => $application->business_email,
        ]);

        return ApplicantLoginResponseData::success(
            message:     'Signed in successfully.',
            application: ApplicationResponseData::fromModel($application),
            token:       $token,
        );
    }

    // ─────────────────────── LOGOUT ───────────────────────
    public function logout(ApplicationModel $application): ApplicantLoginResponseData
    {
        try {
            Auth::guard(config('applicant_otp.guard', 'applicants'))->logout();
        } catch (TokenExpiredException | TokenInvalidException) {
            // Already invalid — treat as success
        } catch (JWTException) {
            return ApplicantLoginResponseData::error('Could not invalidate token.');
        }

        return ApplicantLoginResponseData::success('Logged out successfully.');
    }

    // ─────────────────────── HELPERS ───────────────────────
    private function findByEmail(string $email): ?ApplicationModel
    {
        return ApplicationModel::where('business_email', $email)->first();
    }

    private function maskEmail(string $email): string
    {
        $at = strpos($email, '@');
        if ($at === false || $at < 2) return $email;
        return substr($email, 0, 2) . str_repeat('*', max(1, $at - 2)) . substr($email, $at);
    }
}
