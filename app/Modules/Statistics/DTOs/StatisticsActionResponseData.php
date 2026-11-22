<?php

namespace App\Modules\Statistics\DTOs;

class StatisticsActionResponseData
{
    public function __construct(
        public readonly string  $status,
        public readonly string  $message,
        public readonly ?StatisticsResponseData $statistics = null,
        public readonly array   $errors = [],
    ) {}

    public static function success(string $message, StatisticsResponseData $statistics): self
    {
        return new self('success', $message, $statistics, []);
    }

    public static function error(string $message, array $errors = []): self
    {
        return new self('error', $message, null, $errors);
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
            'data'    => $this->statistics?->toArray() ?? StatisticsResponseData::empty()->toArray(),
            'errors'  => $this->errors,
        ];
    }
}
