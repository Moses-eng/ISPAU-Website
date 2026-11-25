<?php

namespace App\Helpers;

use App\Modules\Application\Models\ApplicationModel;
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
     * Notify finance when an application is approved and awaiting invoice / payment.
     */
    public static function notifyApprovedAwaitingPayment(ApplicationModel $application): ?FinanceAdminNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $appNumber = $application->application_number ? " (#{$application->application_number})" : "";

        $title = 'Application Approved — Awaiting Payment';
        $message = "Application for '{$application->legal_name}'{$appNumber} has been approved and requires invoice/payment tracking.";

        return self::createNotification(
            title: $title,
            message: $message,
            applicantId: $application->id,
            applicantName: $applicantName,
            applicantEmail: $application->business_email,
            type: 'info'
        );
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
