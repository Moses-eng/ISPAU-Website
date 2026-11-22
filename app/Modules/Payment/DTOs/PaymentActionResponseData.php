<?php

namespace App\Modules\Payment\DTOs;

class PaymentActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?PaymentResponseData $payment = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?PaymentResponseData $payment = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            payment: $payment,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            payment: null,
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
                'payment' => $this->payment?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
