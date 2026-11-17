<?php

namespace App\Modules\MembershipAdminNotification\DTOs;

class MembershipAdminNotificationActionResponseData
{
    public function __construct(
        public readonly string $status,
        public readonly string $message,
        public readonly ?MembershipAdminNotificationResponseData $notification = null,
        public readonly array $errors = [],
        public readonly array $payload = [],
    ) {}

    public static function success(
        string $message,
        ?MembershipAdminNotificationResponseData $notification = null,
        array $payload = [],
    ): self {
        return new self('success', $message, $notification, [], $payload);
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
                'notification' => $this->notification?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
