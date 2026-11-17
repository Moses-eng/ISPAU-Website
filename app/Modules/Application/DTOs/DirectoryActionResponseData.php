<?php

namespace App\Modules\Application\DTOs;

class DirectoryActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?DirectoryResponseData $member = null,
        public readonly array   $errors = [],
        public readonly array   $payload = [],
    ) {}

    public static function success(
        string $message,
        ?DirectoryResponseData $member = null,
        array $payload = [],
    ): self {
        return new self(
            status:  'success',
            message: $message,
            member:  $member,
            errors:  [],
            payload: $payload,
        );
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self(
            status:  'error',
            message: $message,
            member:  null,
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
            'data'    => $this->member
                ? $this->member->toArray()
                : [
                    'items' => $this->payload['items'] ?? [],
                    'total' => $this->payload['total'] ?? 0,
                    ...$this->payload,
                ],
            'errors'  => $this->errors,
        ];
    }
}
