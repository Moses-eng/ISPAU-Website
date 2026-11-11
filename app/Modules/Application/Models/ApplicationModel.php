<?php

namespace App\Modules\Application\Models;

use App\Providers\JwtAuthenticatable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;

class ApplicationModel extends JwtAuthenticatable
{
    use HasUuids;

    protected $table = 'applications';

    protected $fillable = [
        'legal_name', 'trading_name', 'entity_type', 'registration_country',
        'registration_reference', 'business_email', 'business_phone', 'website',
        'password',
        'registered_address', 'uganda_address',
        'category', 'operational_status', 'requested_tier', 'customer_facing',
        'pdpo_status', 'licence_relevant',
        'applicant_name', 'applicant_role', 'applicant_email', 'applicant_phone',
        'representative_name', 'representative_role',
        'representative_email', 'representative_phone',
        'billing_email', 'billing_contact', 'invoice_address',
        'organisation_details', 'compliance_details', 'applicant_details',
        'billing_details', 'profile_optional', 'restrictions',
        'declarations', 'attachments',
        'status',

        // opt
        'otp_code_hash', 'otp_requested_at', 'otp_expires_at',
        'otp_attempts', 'last_login_at', 'last_login_ip',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password'             => 'hashed',
        'organisation_details' => 'array',
        'compliance_details'   => 'array',
        'applicant_details'    => 'array',
        'billing_details'      => 'array',
        'profile_optional'     => 'array',
        'restrictions'         => 'array',
        'declarations'         => 'array',
        'attachments'          => 'array',
        'otp_requested_at'     => 'datetime',
        'otp_expires_at'       => 'datetime',
        'last_login_at'        => 'datetime',
        'otp_attempts'         => 'integer',
    ];
    // Status helpers
    public function isDraft(): bool                  { return $this->status === 'Draft'; }
    public function isSubmitted(): bool              { return $this->status === 'Submitted'; }
    public function isUnderReview(): bool            { return $this->status === 'Under review'; }
    public function isClarificationNeeded(): bool    { return $this->status === 'Clarification needed'; }
    public function isDecisionPending(): bool        { return $this->status === 'Decision pending'; }
    public function isApprovedAwaitingPayment(): bool{ return $this->status === 'Approved awaiting payment'; }
    public function isActive(): bool                 { return $this->status === 'Active'; }
    public function isDeferred(): bool               { return $this->status === 'Deferred'; }
    public function isDeclined(): bool               { return $this->status === 'Declined'; }

    public function clarifications(): HasMany
    {
        return $this->hasMany(ClarificationModel::class, 'application_id');
    }
    public function reviewers(): HasMany
    {
        return $this->hasMany(ReviewerModel::class, 'application_id');
    }
    public function verifications(): HasMany
    {
        return $this->hasMany(VerificationModel::class, 'application_id');
    }


        // ── OTP helpers () ─────────────────────────
            // JWT
    public function getUserType(): string
    {
        return 'applicant';
    }
    public function generateOtp(int $ttlMinutes): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->otp_code_hash    = Hash::make($code);
        $this->otp_requested_at = now();
        $this->otp_expires_at   = now()->addMinutes($ttlMinutes);
        $this->otp_attempts     = 0;
        $this->save();
        return $code;
    }

    public function otpMatches(string $code): bool
    {
        return $this->otp_code_hash
            ? Hash::check($code, $this->otp_code_hash)
            : false;
    }

    public function otpExpired(): bool
    {
        return ! $this->otp_expires_at || $this->otp_expires_at->isPast();
    }

    public function resendCooldownRemaining(int $cooldownSeconds): int
    {
        if (! $this->otp_requested_at) return 0;
        $readyAt = $this->otp_requested_at->copy()->addSeconds($cooldownSeconds);
        return max(0, $readyAt->getTimestamp() - now()->getTimestamp());
    }

    public function recordLogin(?string $ip): void
    {
        $this->last_login_at    = now();
        $this->last_login_ip    = $ip;
        $this->otp_code_hash    = null;
        $this->otp_requested_at = null;
        $this->otp_expires_at   = null;
        $this->otp_attempts     = 0;
        $this->save();
    }

    public function clearOtp(): void
    {
        $this->otp_code_hash    = null;
        $this->otp_requested_at = null;
        $this->otp_expires_at   = null;
        $this->otp_attempts     = 0;
        $this->save();
    }

    public function incrementOtpAttempts(): void
    {
        $this->otp_attempts = ($this->otp_attempts ?? 0) + 1;
        $this->save();
    }
}
