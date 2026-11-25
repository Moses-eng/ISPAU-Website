<?php

namespace App\Modules\Activity\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ActivityModel extends Model
{
    use HasUuids;

    protected $table = 'activities';

    protected $fillable = [
        'title',
        'slug',
        'category',
        'author',
        'organiser',
        'location',
        'starts_at',
        'ends_at',
        'date_note',
        'registration_url',
        'summary',
        'body',
        'image',
        'image_url',
        'image_alt',
        'image_credit',
        'seo_title',
        'seo_description',
        'status',
        'published_at',
    ];

    protected $casts = [
        'starts_at'    => 'datetime',
        'ends_at'      => 'datetime',
        'published_at' => 'datetime',
    ];

    public function isDraft(): bool     { return $this->status === 'draft'; }
    public function isPublished(): bool { return $this->status === 'published'; }
    public function isArchived(): bool  { return $this->status === 'archived'; }
}
