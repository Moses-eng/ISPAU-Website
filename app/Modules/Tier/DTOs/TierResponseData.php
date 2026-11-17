<?php

namespace App\Modules\Tier\DTOs;

use App\Modules\Tier\Models\TierModel;

class TierResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly float   $cost,
        public readonly ?string $description,
        public readonly string  $status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(TierModel $m): self
    {
        return new self(
            id:          $m->id,
            name:        $m->name,
            cost:        (float) $m->cost,
            description: $m->description,
            status:      $m->status,
            created_at:  optional($m->created_at)->toIso8601String(),
            updated_at:  optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'cost'        => $this->cost,
            'description' => $this->description,
            'status'      => $this->status,
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
