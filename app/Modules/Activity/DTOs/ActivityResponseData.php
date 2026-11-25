<?php

namespace App\Modules\Activity\DTOs;

use App\Modules\Activity\Models\ActivityModel;

class ActivityResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly ?string $title,
        public readonly ?string $slug,
        public readonly ?string $category,
        public readonly ?string $author,
        public readonly ?string $organiser,
        public readonly ?string $location,
        public readonly ?string $startsAt,
        public readonly ?string $endsAt,
        public readonly ?string $dateNote,
        public readonly ?string $registrationUrl,
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

    public static function fromModel(ActivityModel $m): self
    {
        return new self(
            id:              $m->id,
            title:           $m->title,
            slug:            $m->slug,
            category:        $m->category,
            author:          $m->author,
            organiser:       $m->organiser,
            location:        $m->location,
            startsAt:        optional($m->starts_at)->toIso8601String(),
            endsAt:          optional($m->ends_at)->toIso8601String(),
            dateNote:        $m->date_note,
            registrationUrl: $m->registration_url,
            image:           $m->image,
            summary:         $m->summary,
            body:            $m->body,
            imageUrl:        $m->image_url,
            imageAlt:        $m->image_alt,
            imageCredit:     $m->image_credit,
            seoTitle:        $m->seo_title,
            seoDescription:  $m->seo_description,
            status:          $m->status,
            publishedAt:     optional($m->published_at)->toIso8601String(),
            createdAt:       optional($m->created_at)->toIso8601String(),
            updatedAt:       optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'slug'             => $this->slug,
            'category'         => $this->category,
            'author'           => $this->author,
            'organiser'        => $this->organiser,
            'location'         => $this->location,
            'starts_at'        => $this->startsAt,
            'startsAt'         => $this->startsAt,
            'ends_at'          => $this->endsAt,
            'endsAt'           => $this->endsAt,
            'date_note'        => $this->dateNote,
            'dateNote'         => $this->dateNote,
            'registration_url' => $this->registrationUrl,
            'registrationUrl'  => $this->registrationUrl,
            'image'            => $this->image,
            'summary'          => $this->summary,
            'body'             => $this->body,
            'image_url'        => $this->imageUrl,
            'imageUrl'         => $this->imageUrl,
            'image_alt'        => $this->imageAlt,
            'imageAlt'         => $this->imageAlt,
            'image_credit'     => $this->imageCredit,
            'imageCredit'      => $this->imageCredit,
            'seo_title'        => $this->seoTitle,
            'seoTitle'         => $this->seoTitle,
            'seo_description'  => $this->seoDescription,
            'seoDescription'   => $this->seoDescription,
            'status'           => $this->status,
            'published_at'     => $this->publishedAt,
            'publishedAt'      => $this->publishedAt,
            'created_at'       => $this->createdAt,
            'updated_at'       => $this->updatedAt,
        ];
    }
}
