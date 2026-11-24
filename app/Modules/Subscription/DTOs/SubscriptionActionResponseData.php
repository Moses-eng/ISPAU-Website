<?php

namespace App\Modules\Subscription\DTOs;

class SubscriptionActionResponseData
{
    public function __construct(
        public readonly string $status,
        public readonly string $message,
        public readonly ?SubscriptionResponseData $subscription = null,
        public readonly array $errors = [],
        public readonly array $payload = [],
    ) {}

    public static function success(
        string $message,
        ?SubscriptionResponseData $subscription = null,
        array $payload = [],
    ): self {
        return new self('success', $message, $subscription, [], $payload);
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
                'subscription' => $this->subscription?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
