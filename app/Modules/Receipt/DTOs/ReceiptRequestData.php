<?php

namespace App\Modules\Receipt\DTOs;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class ReceiptRequestData
{
    public function __construct(
        public readonly ?string $invoice_id = null,
        public readonly ?string $applicant_id = null,
        public readonly ?UploadedFile $receipt_pdf = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            invoice_id:   $request->input('invoice_id'),
            applicant_id: $request->input('applicant_id'),
            receipt_pdf:  $request->file('receipt_pdf'),
        );
    }

    /**
     * Scalar attributes only — the file is handled by ReceiptAttachmentService.
     */
    public function toArray(): array
    {
        return array_filter([
            'invoice_id'   => $this->invoice_id,
            'applicant_id' => $this->applicant_id,
        ], fn ($v) => ! is_null($v));
    }
}
