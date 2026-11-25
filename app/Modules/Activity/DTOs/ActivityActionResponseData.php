<?php

namespace App\Modules\Activity\DTOs;

class ActivityActionResponseData
{
    public function __construct(
        public readonly string $status,
        public readonly string $message,
        public readonly ?ActivityResponseData $activity = null,
        public readonly array $errors = [],
        public readonly array $payload = [],
    ) {}

    public static function success(
        string $message,
        ?ActivityResponseData $activity = null,
        array $payload = [],
    ): self {
        return new self('success', $message, $activity, [], $payload);
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self('error', $message, null, $errors, []);
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
                'activity' => $this->activity?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
