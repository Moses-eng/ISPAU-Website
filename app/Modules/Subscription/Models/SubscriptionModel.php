<?php

namespace App\Modules\Subscription\Models;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Payment\Models\PaymentModel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionModel extends Model
{
    use HasUuids;

    protected $table = 'applicant_subscriptions';

    protected $fillable = [
        'applicant_id',
        'invoice_id',
        'payment_id',
        'payment_confirmed_at',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected $casts = [
        'payment_confirmed_at' => 'datetime',
        'starts_at'            => 'datetime',
        'ends_at'              => 'datetime',
    ];

    // ==================== Relations ====================
    public function applicant(): BelongsTo
    {
        return $this->belongsTo(ApplicationModel::class, 'applicant_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(InvoiceModel::class, 'invoice_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(PaymentModel::class, 'payment_id', 'payment_id');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(SubscriptionReminderModel::class, 'subscription_id');
    }

    // ==================== Status helpers ====================
    public function isActive(): bool    { return $this->status === 'active'; }
    public function isExpired(): bool   { return $this->status === 'expired'; }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }

    // ==================== Business helpers ====================
    public function getDaysRemainingAttribute(): int
    {
        if (! $this->ends_at) {
            return 0;
        }

        return max(0, (int) now()->startOfDay()->diffInDays($this->ends_at->startOfDay(), false));
    }

    public function isNearingExpiry(): bool
    {
        return $this->isActive() && $this->ends_at && $this->ends_at->isFuture();
    }
}
