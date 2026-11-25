<?php

namespace App\Modules\Activity\Rules;

use Illuminate\Validation\Rule;

class ActivityRule
{
    public static function createRules(): array
    {
        return [
            'title'            => 'required|string|max:180',
            'slug'             => 'nullable|string|max:140|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'category'         => 'required|string|max:80',
            'author'           => 'required|string|max:120',
            'organiser'        => 'nullable|string|max:180',
            'location'         => 'nullable|string|max:240',
            'starts_at'        => 'nullable|date',
            'startsAt'         => 'nullable|date',
            'ends_at'          => 'nullable|date',
            'endsAt'           => 'nullable|date',
            'date_note'        => 'nullable|string|max:240',
            'dateNote'         => 'nullable|string|max:240',
            'registration_url' => 'nullable|url|max:2048',
            'registrationUrl'  => 'nullable|url|max:2048',
            'summary'          => 'nullable|string',
            'body'             => 'required|string',
            'image'            => 'nullable|file|image|mimes:jpeg,png,webp|max:5120',
            'image_url'        => 'nullable|url|max:2048',
            'imageUrl'         => 'nullable|url|max:2048',
            'image_alt'        => 'nullable|string|max:255',
            'imageAlt'         => 'nullable|string|max:255',
            'image_credit'     => 'nullable|string|max:255',
            'imageCredit'      => 'nullable|string|max:255',
            'seo_title'        => 'nullable|string|max:180',
            'seoTitle'         => 'nullable|string|max:180',
            'seo_description'  => 'nullable|string|max:320',
            'seoDescription'   => 'nullable|string|max:320',
            'status'           => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
            'published_at'     => 'nullable|date',
            'publishedAt'      => 'nullable|date',
        ];
    }

    public static function updateRules(string $id): array
    {
        $rules = self::createRules();

        foreach ($rules as $key => $value) {
            $rules[$key] = 'sometimes|' . (is_string($value) ? $value : '');
            if (! is_string($value)) {
                $rules[$key] = array_merge(['sometimes'], (array) $value);
            }
        }

        $rules['slug'] = [
            'sometimes',
            'string',
            'max:140',
            'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            Rule::unique('activities', 'slug')->ignore($id),
        ];

        return $rules;
    }
}
