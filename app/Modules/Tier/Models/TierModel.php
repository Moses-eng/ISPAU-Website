<?php

namespace App\Modules\Tier\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TierModel extends Model
{
    use HasUuids;

    protected $table = 'tiers';

    protected $fillable = [
        'name',
        'cost',
        'description',
        'status',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isInactive(): bool { return $this->status === 'inactive'; }
    public function isArchived(): bool { return $this->status === 'archived'; }
}
