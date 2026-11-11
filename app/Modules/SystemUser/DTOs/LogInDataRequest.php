<?php

namespace App\Modules\SystemUser\DTOs;

use Illuminate\Http\Request;

class LogInDataRequest
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            email:    strtolower(trim($request->input('email'))),
            password: $request->input('password'),
        );
    }
}
