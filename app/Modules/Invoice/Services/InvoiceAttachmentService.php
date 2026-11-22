<?php

namespace App\Modules\Invoice\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class InvoiceAttachmentService
{
    /** Directory relative to Laravel root public folder: <root>/public/finance/invoices */
    private const BASE_DIR = 'finance/invoices';

    /**
     * Store uploaded invoice PDF at public/finance/invoices/{invoiceId}.pdf
     *
     * @return string|null  relative path (e.g. finance/invoices/{id}.pdf)
     */
    public function storePdf(string $invoiceId, ?UploadedFile $file): ?string
    {
        if (! $file instanceof UploadedFile) {
            return null;
        }

        $relativeDir = self::BASE_DIR;
        $targetDir   = public_path($relativeDir);

        if (! File::isDirectory($targetDir)) {
            File::makeDirectory($targetDir, 0775, true, true);
        }

        try {
            $filename = "{$invoiceId}.pdf";

            // Remove any previous file for this invoice id
            $existing = $targetDir . '/' . $filename;
            if (File::exists($existing)) {
                File::delete($existing);
            }

            $file->move($targetDir, $filename);

            return $relativeDir . '/' . $filename;
        } catch (\Throwable $e) {
            Log::warning('Invoice PDF upload failed', [
                'invoice_id' => $invoiceId,
                'error'      => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Delete the invoice PDF for the given invoice id.
     */
    public function deletePdf(string $invoiceId): void
    {
        try {
            $fullPath = public_path(self::BASE_DIR . "/{$invoiceId}.pdf");
            if (File::exists($fullPath)) {
                File::delete($fullPath);
            }
        } catch (\Throwable $e) {
            Log::warning('Invoice PDF delete failed', [
                'invoice_id' => $invoiceId,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
