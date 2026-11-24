<?php

namespace App\Modules\Subscription\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionReminderModel extends Model
{
    use HasUuids;

    protected $table = 'subscription_reminders';

    protected $fillable = [
        'subscription_id',
        'reminder_type',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(SubscriptionModel::class, 'subscription_id');
    }
}
