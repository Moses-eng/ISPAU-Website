<?php

namespace App\Modules\Receipt\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ReceiptAttachmentService
{
    /** Directory relative to Laravel root public folder: <root>/public/finance/receipt */
    private const BASE_DIR = 'finance/receipt';

    /**
     * Store the uploaded receipt PDF at public/finance/receipt/{receiptId}.pdf
     *
     * @return string|null  relative path (e.g. finance/receipt/{receiptId}.pdf)
     */
    public function storePdf(string $receiptId, ?UploadedFile $file): ?string
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
            $filename = "{$receiptId}.pdf";

            // Overwrite any previous file for this receipt id
            $existing = $targetDir . '/' . $filename;
            if (File::exists($existing)) {
                File::delete($existing);
            }

            $file->move($targetDir, $filename);

            return $relativeDir . '/' . $filename;
        } catch (\Throwable $e) {
            Log::warning('Receipt PDF upload failed', [
                'receipt_id' => $receiptId,
                'error'      => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Delete the receipt PDF for the given receipt id.
     */
    public function deletePdf(string $receiptId): void
    {
        try {
            $fullPath = public_path(self::BASE_DIR . "/{$receiptId}.pdf");
            if (File::exists($fullPath)) {
                File::delete($fullPath);
            }
        } catch (\Throwable $e) {
            Log::warning('Receipt PDF delete failed', [
                'receipt_id' => $receiptId,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
