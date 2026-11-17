<?php

namespace App\Modules\Tier\Rules;

use Illuminate\Validation\Rule;

class TierRule
{
    public static function createRules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'cost'        => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }

    public static function updateRules(string $tierId): array
    {
        return [
            'name'        => 'sometimes|string|max:255',
            'cost'        => 'sometimes|numeric|min:0',
            'description' => 'sometimes|nullable|string',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }
}
