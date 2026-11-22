<?php

namespace App\Modules\Receipt\DTOs;

use App\Modules\Receipt\Models\ReceiptModel;

class ReceiptResponseData
{
    public function __construct(
        public readonly string  $receipt_id,
        public readonly string  $invoice_id,
        public readonly string  $applicant_id,
        public readonly ?string $receipt_pdf,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(ReceiptModel $m): self
    {
        return new self(
            receipt_id:   $m->receipt_id,
            invoice_id:   $m->invoice_id,
            applicant_id: $m->applicant_id,
            receipt_pdf:  $m->receipt_pdf,
            created_at:   optional($m->created_at)->toIso8601String(),
            updated_at:   optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'receipt_id'   => $this->receipt_id,
            'invoice_id'   => $this->invoice_id,
            'applicant_id' => $this->applicant_id,
            'receipt_pdf'  => $this->receipt_pdf,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}
