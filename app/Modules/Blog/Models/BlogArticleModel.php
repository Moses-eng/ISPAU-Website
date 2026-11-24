<?php

namespace App\Modules\Blog\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BlogArticleModel extends Model
{
    use HasUuids;

    protected $table = 'blog_articles';

    protected $fillable = [
        'title', 'slug', 'category', 'author',
        'summary', 'body','image',
        'image_url', 'image_alt', 'image_credit',
        'seo_title', 'seo_description',
        'status', 'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    // ==================== Status helpers ====================
    public function isDraft(): bool     { return $this->status === 'draft'; }
    public function isPublished(): bool { return $this->status === 'published'; }
    public function isArchived(): bool  { return $this->status === 'archived'; }
}
