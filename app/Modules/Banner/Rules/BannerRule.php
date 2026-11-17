<?php

namespace App\Modules\Banner\Rules;

use Illuminate\Validation\Rule;

class BannerRule
{
    public static function createRules(): array
    {
        return [
            'image'       => 'required|image|mimes:jpg,jpeg,png,webp|max:5120', // 5 MB
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'page_name'   => 'required|string|max:100',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }

    public static function updateRules(string $bannerId): array
    {
        return [
            'image'       => 'sometimes|image|mimes:jpg,jpeg,png,webp|max:5120',
            'name'        => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:255',
            'page_name'   => 'sometimes|string|max:100',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }
}
