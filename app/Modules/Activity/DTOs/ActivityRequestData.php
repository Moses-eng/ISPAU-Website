<?php

namespace App\Modules\Activity\DTOs;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ActivityRequestData
{
    public function __construct(
        public readonly ?string $title = null,
        public readonly ?string $slug = null,
        public readonly ?string $category = null,
        public readonly ?string $author = null,
        public readonly ?string $organiser = null,
        public readonly ?string $location = null,
        public readonly ?string $startsAt = null,
        public readonly ?string $endsAt = null,
        public readonly ?string $dateNote = null,
        public readonly ?string $registrationUrl = null,
        public readonly ?string $summary = null,
        public readonly ?string $body = null,
        public readonly ?string $imageUrl = null,
        public readonly ?string $imageAlt = null,
        public readonly ?string $imageCredit = null,
        public readonly ?string $seoTitle = null,
        public readonly ?string $seoDescription = null,
        public readonly string  $status = 'draft',
        public readonly ?string $publishedAt = null,
    ) {}

    public static function fromRequest(Request $request, string $forcedStatus = 'draft'): self
    {
        $title = $request->input('title');
        $slug  = $request->input('slug');

        return new self(
            title:           $title,
            slug:            $slug ?: ($title ? Str::slug($title) : null),
            category:        $request->input('category'),
            author:          $request->input('author'),
            organiser:       $request->input('organiser'),
            location:        $request->input('location'),
            startsAt:        $request->input('starts_at') ?? $request->input('startsAt'),
            endsAt:          $request->input('ends_at') ?? $request->input('endsAt'),
            dateNote:        $request->input('date_note') ?? $request->input('dateNote'),
            registrationUrl: $request->input('registration_url') ?? $request->input('registrationUrl'),
            summary:         $request->input('summary'),
            body:            $request->input('body'),
            imageUrl:        $request->input('image_url') ?? $request->input('imageUrl'),
            imageAlt:        $request->input('image_alt') ?? $request->input('imageAlt'),
            imageCredit:     $request->input('image_credit') ?? $request->input('imageCredit'),
            seoTitle:        $request->input('seo_title') ?? $request->input('seoTitle'),
            seoDescription:  $request->input('seo_description') ?? $request->input('seoDescription'),
            status:          (string) $request->input('status', $forcedStatus),
            publishedAt:     $request->input('published_at') ?? $request->input('publishedAt'),
        );
    }

    public function toArray(): array
    {
        $data = [
            'title'            => $this->title,
            'slug'             => $this->slug,
            'category'         => $this->category,
            'author'           => $this->author,
            'organiser'        => $this->organiser,
            'location'         => $this->location,
            'starts_at'        => $this->startsAt,
            'ends_at'          => $this->endsAt,
            'date_note'        => $this->dateNote,
            'registration_url' => $this->registrationUrl,
            'summary'          => $this->summary,
            'body'             => $this->body,
            'image_url'        => $this->imageUrl,
            'image_alt'        => $this->imageAlt,
            'image_credit'     => $this->imageCredit,
            'seo_title'        => $this->seoTitle,
            'seo_description'  => $this->seoDescription,
            'status'           => $this->status,
            'published_at'     => $this->publishedAt,
        ];

        return array_filter($data, fn ($v) => $v !== null);
    }
}
