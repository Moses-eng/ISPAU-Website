<?php

namespace App\Helpers;

use App\Modules\FinanceAdminNotification\Models\FinanceAdminNotificationModel;
use Illuminate\Support\Facades\Log;

class FinanceAdminNotificationHelper
{
    /**
     * Base method to create a finance admin notification.
     */
    public static function createNotification(
        string $title,
        string $message,
        string $applicantId,
        ?string $applicantName = null,
        ?string $applicantEmail = null,
        string $type = 'info'
    ): ?FinanceAdminNotificationModel {
        try {
            return FinanceAdminNotificationModel::create([
                'title'           => $title,
                'message'         => $message,
                'type'            => $type,
                'applicant_id'    => $applicantId,
                'applicant_name'  => $applicantName,
                'applicant_email' => $applicantEmail,
                'is_read'         => false,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to create finance admin notification', [
                'applicant_id' => $applicantId,
                'error'        => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Notify finance when an applicant uploads a payment receipt.
     */
    public static function reciptUploaded(
        string $applicantId,
        string $invoiceNumber,
        ?string $applicantName = null,
        ?string $applicantEmail = null
    ): ?FinanceAdminNotificationModel {
        $name = $applicantName ?: 'An applicant';
        $title = 'Proof of Payment Uploaded';
        $message = "Payment receipt uploaded by {$name} for Invoice #{$invoiceNumber}.";

        return self::createNotification(
            title: $title,
            message: $message,
            applicantId: $applicantId,
            applicantName: $applicantName,
            applicantEmail: $applicantEmail,
            type: 'info'
        );
    }
}
