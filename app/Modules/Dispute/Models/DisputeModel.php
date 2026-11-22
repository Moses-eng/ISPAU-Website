<?php

namespace App\Modules\Dispute\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DisputeModel extends Model
{
    use HasUuids;

    protected $table = 'disputes';

    protected $fillable = [
        'name',
        'email',
        'reason',
        'recordId',
        'status',
    ];

    protected $casts = [];

    // ==================== Status helpers ====================
    public function isPending(): bool  { return $this->status === 'pending'; }
    public function isReviewed(): bool { return $this->status === 'reviewed'; }
    public function isResolved(): bool { return $this->status === 'resolved'; }
    public function isRejected(): bool { return $this->status === 'rejected'; }
}
