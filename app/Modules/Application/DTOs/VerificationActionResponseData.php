<?php

namespace App\Modules\Application\DTOs;

class VerificationActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?VerificationResponseData $verification = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?VerificationResponseData $verification = null,
        array $payload = [],
    ): self {
        return new self(
            status:       'success',
            message:      $message,
            verification: $verification,
            errors:       [],
            payload:      $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:       'error',
            message:      $message,
            verification: null,
            errors:       $errors,
            payload:      [],
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
                'verification' => $this->verification?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
