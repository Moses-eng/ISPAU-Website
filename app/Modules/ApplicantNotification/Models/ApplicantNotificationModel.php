<?php

namespace App\Modules\ApplicantNotification\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ApplicantNotificationModel extends Model
{
    use HasUuids;

    protected $table = 'applicant_notifications';

    protected $fillable = [
        'title',
        'message',
        'type',
        'applicant_id',
        'applicant_name',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read'    => 'boolean',
        'read_at'    => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ==================== Helpers ====================

    public function markAsRead(): bool
    {
        $this->is_read = true;
        $this->read_at = now();
        return $this->save();
    }

    public function getFormattedTypeAttribute(): array
    {
        $types = [
            'info'    => ['label' => 'Information', 'color' => '#2196f3'],
            'warning' => ['label' => 'Warning',     'color' => '#ff9800'],
            'success' => ['label' => 'Success',     'color' => '#4caf50'],
            'error'   => ['label' => 'Error',       'color' => '#f44336'],
        ];

        return $types[$this->type] ?? $types['info'];
    }

    // ==================== Scopes ====================

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForApplicant($query, $applicantId)
    {
        return $query->where('applicant_id', $applicantId);
    }

    public function scopeRecent($query, int $limit = 10)
    {
        return $query->orderByDesc('created_at')->limit($limit);
    }
}
