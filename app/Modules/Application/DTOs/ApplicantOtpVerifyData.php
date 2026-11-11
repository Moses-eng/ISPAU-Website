<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;

class ApplicantOtpVerifyData
{
    public function __construct(
        public readonly string $email,
        public readonly string $code,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: strtolower(trim((string) $request->input('businessEmail'))),
            code:  trim((string) $request->input('code')),
        );
    }
}
