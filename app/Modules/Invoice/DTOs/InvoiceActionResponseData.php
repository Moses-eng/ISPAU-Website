<?php

namespace App\Modules\Invoice\DTOs;

class InvoiceActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?InvoiceResponseData $invoice = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?InvoiceResponseData $invoice = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            invoice: $invoice,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            invoice: null,
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
                'invoice' => $this->invoice?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
