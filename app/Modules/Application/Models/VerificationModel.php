<?php

namespace App\Modules\Application\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationModel extends Model
{
    use HasUuids;

    protected $table = 'verifications';

    protected $fillable = [
        'application_id',
        'reviewer_id',
        'reviewer_name',
        'assigned_by',
        'assigned_by_name',
        'registration_result',
        'registration_note',
        'authority_result',
        'authority_note',
        'regulatory_result',
        'regulatory_note',
        'status',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ApplicationModel::class, 'application_id');
    }
}
