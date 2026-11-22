<?php

namespace App\Helpers;

use App\Modules\ApplicantNotification\Models\ApplicantNotificationModel;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Payment\Models\PaymentModel;
use Illuminate\Support\Facades\Log;

class ApplicantNotificationHelper
{
    /**
     * Base method to create a notification for an applicant.
     */
    public static function createNotification(
        string $title,
        string $message,
        string $applicantId,
        ?string $applicantName = null,
        string $type = 'info'
    ): ?ApplicantNotificationModel {
        try {
            return ApplicantNotificationModel::create([
                'title'          => $title,
                'message'        => $message,
                'type'           => $type,
                'applicant_id'   => $applicantId,
                'applicant_name' => $applicantName,
                'is_read'        => false,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to create applicant notification', [
                'applicant_id' => $applicantId,
                'error'        => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Notify applicant that their application has been successfully submitted.
     */
    public static function notifyApplicationSubmitted(ApplicationModel $application): ?ApplicantNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $message = "Your membership application for '{$application->legal_name}' has been successfully submitted and is now under review.";

        return self::createNotification(
            title: 'Application Submitted',
            message: $message,
            applicantId: $application->id,
            applicantName: $applicantName,
            type: 'success'
        );
    }

    /**
     * Notify applicant that a draft has been saved.
     */
    public static function notifyDraftSaved(ApplicationModel $application): ?ApplicantNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $message = "Your draft application for '{$application->legal_name}' has been saved successfully.";

        return self::createNotification(
            title: 'Draft Saved',
            message: $message,
            applicantId: $application->id,
            applicantName: $applicantName,
            type: 'info'
        );
    }

    /**
     * Notify applicant when their application status changes.
     */
    public static function notifyStatusUpdated(ApplicationModel $application, string $status): ?ApplicantNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $normalizedStatus = strtolower(trim($status));

        $statusMessages = [
            'approved'          => 'has been approved.',
            'rejected'          => 'has been rejected.',
            'under_review'      => 'is currently under review.',
            'under review'      => 'is currently under review.',
            'submitted'         => 'has been submitted.',
            'revision_required' => 'requires revision.',
            'revision required' => 'requires revision.',
            'draft'             => 'has been saved as draft.',
        ];

        $type = match ($normalizedStatus) {
            'approved'                                    => 'success',
            'rejected'                                    => 'error',
            'revision_required', 'revision required'      => 'warning',
            default                                       => 'info',
        };

        $actionText = $statusMessages[$normalizedStatus] ?? "has been updated to '{$status}'.";
        $message = "Your application for '{$application->legal_name}' {$actionText}";

        return self::createNotification(
            title: 'Application Status Updated',
            message: $message,
            applicantId: $application->id,
            applicantName: $applicantName,
            type: $type
        );
    }

    /**
     * Notify applicant when an application is deleted.
     */
    public static function notifyApplicationDeleted(string $legalName, string $applicantId, ?string $applicantName = null): ?ApplicantNotificationModel
    {
        return self::createNotification(
            title: 'Application Deleted',
            message: "Your application for '{$legalName}' has been removed.",
            applicantId: $applicantId,
            applicantName: $applicantName,
            type: 'warning'
        );
    }
    /**
     * Notify applicant when a membership invoice is generated.
     */
    public static function notifyInvoiceCreated(InvoiceModel $invoice, ?string $applicantName = null): ?ApplicantNotificationModel
    {
        $totalFormatted = number_format((float) ($invoice->total ?? 0), 2);
        $message = "Invoice #{$invoice->invoice_number} for USD {$totalFormatted} has been issued for your ISPAU membership.";

        return self::createNotification(
            title: 'New Invoice Issued',
            message: $message,
            applicantId: $invoice->applicant_id,
            applicantName: $applicantName,
            type: 'info'
        );
    }
    /**
     * Notify applicant when a payment is received and recorded.
     */
    public static function notifyPaymentCreated(PaymentModel $payment, ?string $applicantName = null): ?ApplicantNotificationModel
    {
        $amountFormatted = number_format((float) ($payment->amount ?? 0), 2);
        $message = "A payment of USD {$amountFormatted} (Receipt #{$payment->payment_no}) has been received and confirmed.";

        return self::createNotification(
            title: 'Payment Received',
            message: $message,
            applicantId: $payment->applicant_id,
            applicantName: $applicantName,
            type: 'success'
        );
    }

}
