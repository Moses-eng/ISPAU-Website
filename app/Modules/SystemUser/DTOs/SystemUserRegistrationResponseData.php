<?php

namespace App\Modules\SystemUser\DTOs;

class SystemUserRegistrationResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?SystemUserResponseData $user = null,
        public readonly ?string $token = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?SystemUserResponseData $user = null,
        ?string $token = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            user:    $user,
            token:   $token,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            user:    null,
            token:   null,
            errors:  $errors,
            payload: [],
        );
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }

    public function toArray(): array
    {
        return [
            'status'  => $this->status,
            'message' => $this->message,
            'data'    => [
                'user'  => $this->user?->toArray(),
                'token' => $this->token,
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
