<?php

namespace App\Modules\Application\DTOs;

class ReviewerActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?ReviewerResponseData $reviewer = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?ReviewerResponseData $reviewer = null,
        array $payload = [],
    ): self {
        return new self(
            status:   'success',
            message:  $message,
            reviewer: $reviewer,
            errors:   [],
            payload:  $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:   'error',
            message:  $message,
            reviewer: null,
            errors:   $errors,
            payload:  [],
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
                'reviewer' => $this->reviewer?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
