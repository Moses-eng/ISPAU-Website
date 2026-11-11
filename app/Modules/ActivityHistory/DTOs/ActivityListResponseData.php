<?php

namespace App\Modules\ActivityHistory\DTOs;

class ActivityListResponseData
{
    public function __construct(
        public readonly string $status,
        public readonly string $message,
        public readonly array  $items = [],
        public readonly int    $total = 0,
        public readonly array  $filters = [],
        public readonly array  $errors = [],
    ) {}

    public static function success(string $message, array $items, array $filters = []): self
    {
        return new self('success', $message, $items, count($items), $filters);
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self('error', $message, [], 0, [], $errors);
    }

    public function isSuccess(): bool { return $this->status === 'success'; }

    public function toArray(): array
    {
        return [
            'status'  => $this->status,
            'message' => $this->message,
            'data'    => [
                'items'   => $this->items,
                'total'   => $this->total,
                'filters' => $this->filters,
            ],
            'errors'  => $this->errors,
        ];
    }
}
