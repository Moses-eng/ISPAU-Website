<?php

namespace App\Modules\Dispute\DTOs;

class DisputeActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?DisputeResponseData $dispute = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?DisputeResponseData $dispute = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            dispute: $dispute,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            dispute: null,
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
                'dispute' => $this->dispute?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
