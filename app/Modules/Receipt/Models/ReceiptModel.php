<?php

namespace App\Modules\Receipt\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ReceiptModel extends Model
{
    use HasUuids;

    protected $table = 'receipts';

    // Non-default primary key
    protected $primaryKey = 'receipt_id';
    public    $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'invoice_id',
        'applicant_id',
        'receipt_pdf',
    ];

    protected $casts = [];

    // ==================== Helpers ====================
    public function hasPdf(): bool
    {
        return ! empty($this->receipt_pdf);
    }
}
