<?php

namespace App\Modules\Statistics\DTOs;

class StatisticsResponseData
{
    public function __construct(
        public readonly int $finance,
        public readonly int $applicants,
        public readonly int $other,
    ) {}

    public static function empty(): self
    {
        return new self(finance: 0, applicants: 0, other: 0);
    }

    public function toArray(): array
    {
        return [
            'finance'    => $this->finance,
            'applicants' => $this->applicants,
            'other'      => $this->other,
        ];
    }
}
