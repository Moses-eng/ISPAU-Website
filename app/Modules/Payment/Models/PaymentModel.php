<?php

namespace App\Modules\Payment\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PaymentModel extends Model
{
    use HasUuids;

    protected $table = 'payments';

    // Non-default primary key
    protected $primaryKey = 'payment_id';
    public    $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'invoice_id',
        'payment_no',
        'applicant_id',
        'created_by',
        'amount',
        'status',
        'period',
        'paid_at',
        'payment_reference',
    ];

    protected $casts = [
        'amount'  => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool    { return $this->status === 'active'; }
    public function isNotActive(): bool { return $this->status === 'not active'; }

    // ==================== Business helpers ====================
    public function isPaid(): bool
    {
        return $this->paid_at !== null;
    }
}
