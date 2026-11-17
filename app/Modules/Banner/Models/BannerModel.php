<?php

namespace App\Modules\Banner\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BannerModel extends Model
{
    use HasUuids;

    protected $table = 'banners';

    protected $fillable = [
        'image',
        'name',
        'description',
        'page_name',
        'status',
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isInactive(): bool { return $this->status === 'inactive'; }
    public function isArchived(): bool { return $this->status === 'archived'; }
}
