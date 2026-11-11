<?php


namespace App\Modules\Application\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClarificationModel extends Model
{
    use HasUuids;

    protected $table = 'clarifications';

    protected $fillable = [
        'application_id',
        'reviewer_id',
        'reviewer_name',
        'assigned_by',
        'assigned_by_name',
        'subject',
        'message',
        'items',
        'response',
        'responded_at',
        'status',
        'requested_at',
    ];

    protected $casts = [
        'items'        => 'array',
        'responded_at' => 'datetime',
        'requested_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ApplicationModel::class, 'application_id');
    }
}
