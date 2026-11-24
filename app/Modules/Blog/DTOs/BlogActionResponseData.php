<?php

namespace App\Modules\Blog\DTOs;

class BlogActionResponseData
{
    public function __construct(
        public readonly string $status,
        public readonly string $message,
        public readonly ?BlogResponseData $article = null,
        public readonly array $errors = [],
        public readonly array $payload = [],
    ) {}

    public static function success(
        string $message,
        ?BlogResponseData $article = null,
        array $payload = [],
    ): self {
        return new self('success', $message, $article, [], $payload);
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
                'article' => $this->article?->toArray(),
                ...$this->payload,
            ],
            'errors'  => $this->errors,
        ];
    }
}
