<?php

namespace App\Modules\HeroSlide\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class HeroSlideModel extends Model
{
    use HasUuids;

    protected $table = 'hero_slides';

    protected $fillable = [
        'src',
        'description',
        'caption',
        'credit',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isInactive(): bool { return $this->status === 'inactive'; }
    public function isArchived(): bool { return $this->status === 'archived'; }
}
