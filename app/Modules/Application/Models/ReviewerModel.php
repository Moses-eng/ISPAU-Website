<?php

namespace App\Modules\Application\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewerModel extends Model
{
    use HasUuids;

    protected $table = 'reviewers';

    protected $fillable = [
        'application_id',
        'reviewer_id',
        'reviewer_name',
        'assigned_by',
        'assigned_by_name',
        'status',
        'assigned_at',
        'completed_at',
    ];

    protected $casts = [
        'assigned_at'  => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(ApplicationModel::class, 'application_id');
    }
}
