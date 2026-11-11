<?php

namespace App\Modules\Application\DTOs;

use Illuminate\Http\Request;

class ApplicantOtpRequestData
{
    public function __construct(
        public readonly string $email,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email: strtolower(trim((string) $request->input('businessEmail'))),
        );
    }
}
