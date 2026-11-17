<?php

namespace App\Modules\Tier\DTOs;

use App\Modules\Tier\Models\TierModel;

class TierPublicResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly float   $cost,
        public readonly ?string $description,
    ) {}

    public static function fromModel(TierModel $m): self
    {
        return new self(
            id:          $m->id,
            name:        $m->name,
            cost:        (float) $m->cost,
            description: $m->description,
        );
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'cost'        => $this->cost,
            'description' => $this->description,
        ];
    }
}
