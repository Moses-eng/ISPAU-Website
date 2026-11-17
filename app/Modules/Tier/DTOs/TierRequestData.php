<?php

namespace App\Modules\Tier\DTOs;

use Illuminate\Http\Request;

class TierRequestData
{
    public function __construct(
        public readonly string  $name,
        public readonly float   $cost,
        public readonly ?string $description,
        public readonly string  $status = 'active',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name:        $request->input('name'),
            cost:        (float) $request->input('cost'),
            description: $request->input('description'),
            status:      $request->input('status', 'active'),
        );
    }

    public function toArray(): array
    {
        return [
            'name'        => $this->name,
            'cost'        => $this->cost,
            'description' => $this->description,
            'status'      => $this->status,
        ];
    }
}
