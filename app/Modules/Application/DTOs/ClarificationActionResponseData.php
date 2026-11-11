<?php

namespace App\Modules\Application\DTOs;

class ClarificationActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?ClarificationResponseData $clarification = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?ClarificationResponseData $clarification = null,
        array $payload = [],
    ): self {
        return new self(
            status:        'success',
            message:       $message,
            clarification: $clarification,
            errors:        [],
            payload:       $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:        'error',
            message:       $message,
            clarification: null,
            errors:        $errors,
            payload:       [],
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
                'clarification' => $this->clarification?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
