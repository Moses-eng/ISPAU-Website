<?php

namespace App\Modules\Contact\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ContactModel extends Model
{
    use HasUuids;

    protected $table = 'contacts';

    protected $fillable = [
        'name',
        'work_email',
        'organisation',
        'message',
        'enquiry_type',
        'status',
    ];

    protected $casts = [
        // status is a plain enum string — no cast needed
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool   { return $this->status === 'active'; }
    public function isInactive(): bool { return $this->status === 'inactive'; }
    public function isArchived(): bool { return $this->status === 'archived'; }
}
