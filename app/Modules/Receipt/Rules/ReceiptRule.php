<?php

namespace App\Modules\Receipt\Rules;

class ReceiptRule
{
    /**
     * Admin create — attaches an existing receipt record (rare; usually
     * receipts are created by the applicant through uploadReceipt).
     */
    public static function createRules(): array
    {
        return [
            'invoice_id'   => 'required|uuid|exists:invoices,id',
            'applicant_id' => 'required|uuid|exists:applications,id',
            'receipt_pdf'  => 'nullable|file|mimes:pdf|max:10240', // 10 MB
        ];
    }

    public static function updateRules(string $receiptId): array
    {
        return [
            'invoice_id'   => 'sometimes|uuid|exists:invoices,id',
            'applicant_id' => 'sometimes|uuid|exists:applications,id',
            'receipt_pdf'  => 'nullable|file|mimes:pdf|max:10240',
        ];
    }

    public static function uploadRules(): array
    {
        return [
            'invoice_id'  => 'required|uuid|exists:invoices,id',
            'applicant_id' => 'required|uuid|exists:applications,id',
            'receipt_pdf' => 'required|file|mimes:pdf|max:10240', // 10 MB
        ];
    }
}
