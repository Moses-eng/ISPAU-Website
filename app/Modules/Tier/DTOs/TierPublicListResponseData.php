<?php

namespace App\Modules\Tier\DTOs;

class TierPublicListResponseData
{
    public function __construct(
        public readonly string $status,
        public readonly string $message,
        public readonly array  $items = [],
        public readonly int    $total = 0,
        public readonly array  $errors = [],
    ) {}

    public static function success(
        string $message,
        array $items,
    ): self {
        return new self(
            status:  'success',
            message: $message,
            items:   $items,
            total:   count($items),
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            items:   [],
            total:   0,
            errors:  $errors,
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
                'items' => $this->items,
                'total' => $this->total,
            ],
            'errors'  => $this->errors,
        ];
    }
}
