<?php

namespace App\Modules\Receipt\DTOs;

class ReceiptActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?ReceiptResponseData $receipt = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?ReceiptResponseData $receipt = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            receipt: $receipt,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            receipt: null,
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
                'receipt' => $this->receipt?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
