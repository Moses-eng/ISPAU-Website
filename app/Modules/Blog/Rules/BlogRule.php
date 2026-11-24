<?php

namespace App\Modules\Blog\Rules;

use Illuminate\Validation\Rule;

class BlogRule
{
    public static function createRules(): array
    {
        return [
            'title'           => 'required|string|max:180',
            'slug'            => 'nullable|string|max:140|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            'category'        => 'required|string|max:80',
            'author'          => 'required|string|max:120',
            'summary'         => 'nullable|string',
            'body'            => 'required|string',          // JSON document
            'image_url'       => 'nullable|url|max:2048',
            'image_alt'       => 'nullable|string|max:255',
            'image' => 'nullable|file|image|mimes:jpeg,png,webp|max:5120',
            'image_credit'    => 'nullable|string|max:255',
            'seo_title'       => 'nullable|string|max:180',
            'seo_description' => 'nullable|string|max:320',
            'status'          => ['sometimes', Rule::in(['draft', 'published', 'archived'])],
            'published_at'    => 'nullable|date',
        ];
    }

    public static function updateRules(string $id): array
    {
        $rules = self::createRules();

        // On update every field becomes optional (partial updates)
        foreach ($rules as $key => $value) {
            $rules[$key] = 'sometimes|' . (is_string($value) ? $value : '');
            if (! is_string($value)) {
                $rules[$key] = array_merge(['sometimes'], (array) $value);
            }
        }

        $rules['slug'] = [
            'sometimes', 'string', 'max:140',
            'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            Rule::unique('blog_articles', 'slug')->ignore($id),
        ];

        return $rules;
    }
}
