<?php

namespace App\Modules\SystemUser\DTOs;

use Illuminate\Http\Request;

class RegisterSystemUserRequestData
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $role = 'membership_admin',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name:     $request->input('name'),
            email:    strtolower(trim($request->input('email'))),
            password: $request->input('password'),
            role:     $request->input('role', 'membership_admin'),
        );
    }

    public function toArray(): array
    {
        return [
            'name'     => $this->name,
            'email'    => $this->email,
            'password' => $this->password,
            'role'     => $this->role,
        ];
    }
}
