<?php

namespace App\Modules\HeroSlide\Rules;

use Illuminate\Validation\Rule;

class HeroSlideRule
{
    public static function createRules(): array
    {
        return [
            'image'       => 'required|image|mimes:jpg,jpeg,png,webp|max:5120', // 5 MB
            'description' => 'required|string|max:255',
            'caption'     => 'required|string|max:255',
            'credit'      => 'nullable|string|max:255',
            'sort_order'  => 'sometimes|integer|min:0',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }

    public static function updateRules(string $slideId): array
    {
        return [
            'image'       => 'sometimes|image|mimes:jpg,jpeg,png,webp|max:5120',
            'description' => 'sometimes|string|max:255',
            'caption'     => 'sometimes|string|max:255',
            'credit'      => 'sometimes|nullable|string|max:255',
            'sort_order'  => 'sometimes|integer|min:0',
            'status'      => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }
}
