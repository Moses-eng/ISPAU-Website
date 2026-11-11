<?php

namespace App\Modules\Application\DTOs;

class ApplicationActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?ApplicationResponseData $application = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?ApplicationResponseData $application = null,
        array $payload = [],
    ): self {
        return new self(
            status:      'success',
            message:     $message,
            application: $application,
            errors:      [],
            payload:     $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:      'error',
            message:     $message,
            application: null,
            errors:      $errors,
            payload:     [],
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
                'application' => $this->application?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
