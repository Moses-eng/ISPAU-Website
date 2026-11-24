<?php

namespace App\Modules\Blog\DTOs;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogRequestData
{
    public function __construct(
        public readonly ?string $title = null,
        public readonly ?string $slug = null,
        public readonly ?string $category = null,
        public readonly ?string $author = null,
        public readonly ?string $summary = null,
        public readonly ?string $body = null,
        public readonly ?string $imageUrl = null,
        public readonly ?string $imageAlt = null,
        public readonly ?string $imageCredit = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly string $status = 'draft',
        public readonly ?string $publishedAt = null,
    ) {}

    public static function fromRequest(Request $request, string $forcedStatus = 'draft'): self
    {
        $title = $request->input('title');
        $slug  = $request->input('slug');

        return new self(
            title:          $title,
            slug:           $slug ?: ($title ? Str::slug($title) : null),
            category:       $request->input('category'),
            author:         $request->input('author'),
            summary:        $request->input('summary'),
            body:           $request->input('body'),
            imageUrl:       $request->input('image_url'),
            imageAlt:       $request->input('image_alt'),
            imageCredit:    $request->input('image_credit'),
            seoTitle:       $request->input('seo_title'),
            seoDescription: $request->input('seo_description'),
            status:         (string) $request->input('status', $forcedStatus),
            publishedAt:    $request->input('published_at'),
        );
    }

    public function toArray(): array
    {
        $data = [
            'title'           => $this->title,
            'slug'            => $this->slug,
            'category'        => $this->category,
            'author'          => $this->author,
            'summary'         => $this->summary,
            'body'            => $this->body,
            'image_url'       => $this->imageUrl,
            'image_alt'       => $this->imageAlt,
            'image_credit'    => $this->imageCredit,
            'seo_title'       => $this->seoTitle,
            'seo_description' => $this->seoDescription,
            'status'          => $this->status,
            'published_at'    => $this->publishedAt,
        ];

        // Drop nulls so PATCH-style updates don't wipe existing columns
        return array_filter($data, fn ($v) => $v !== null);
    }
}
