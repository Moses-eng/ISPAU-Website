<?php

namespace App\Modules\Invoice\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InvoiceModel extends Model
{
    use HasUuids;

    protected $table = 'invoices';

    protected $fillable = [
        'applicant_id',
        'invoice_number',
        'total',
        'status',
        'invoice_date',
        'start_date',
        'end_date',
        'invoice_pdf',
        'membership_period',
        'confirmed_by',
        'payment_status',
    ];

    protected $casts = [
        'total'        => 'decimal:2',
        'invoice_date' => 'date',
        'start_date'   => 'date',
        'end_date'     => 'date',
    ];

    // ==================== Status helpers ====================
    public function isActive(): bool     { return $this->status === 'active'; }
    public function isNotActive(): bool  { return $this->status === 'not active'; }

    // ==================== Payment status helpers ====================
    public function isPaymentConfirmed(): bool { return $this->payment_status === 'Confirmed'; }
    public function isPaymentPending(): bool   { return $this->payment_status === 'Pending'; }

    /**
     * Get invoice number using ID.
     */
    public static function getInvoiceNumber(?string $invoiceId): ?string
    {
        if (! $invoiceId) {
            return null;
        }
        $number = static::find($invoiceId);
        return $number?->invoice_number;
    }
}
