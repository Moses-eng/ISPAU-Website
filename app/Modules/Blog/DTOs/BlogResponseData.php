<?php

namespace App\Modules\Blog\DTOs;

use App\Modules\Blog\Models\BlogArticleModel;

class BlogResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly ?string $title,
        public readonly ?string $slug,
        public readonly ?string $category,
        public readonly ?string $author,
        public readonly ?string $image,
        public readonly ?string $summary,
        public readonly ?string $body,
        public readonly ?string $imageUrl,
        public readonly ?string $imageAlt,
        public readonly ?string $imageCredit,
        public readonly ?string $seoTitle,
        public readonly ?string $seoDescription,
        public readonly string  $status,
        public readonly ?string $publishedAt,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {}

    public static function fromModel(BlogArticleModel $m): self
    {
        return new self(
            id:             $m->id,
            title:          $m->title,
            image:          $m->image,
            slug:           $m->slug,
            category:       $m->category,
            author:         $m->author,
            summary:        $m->summary,
            body:           $m->body,
            imageUrl:       $m->image_url,
            imageAlt:       $m->image_alt,
            imageCredit:    $m->image_credit,
            seoTitle:       $m->seo_title,
            seoDescription: $m->seo_description,
            status:         $m->status,
            publishedAt:    optional($m->published_at)->toIso8601String(),
            createdAt:      optional($m->created_at)->toIso8601String(),
            updatedAt:      optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'              => $this->id,
            'title'           => $this->title,
            'slug'            => $this->slug,
            'image'           => $this->image,
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
            'created_at'      => $this->createdAt,
            'updated_at'      => $this->updatedAt,
        ];
    }
}
