<?php

namespace App\Helpers;

use App\Modules\AdminNotification\Models\AdminNotificationModel;
use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Support\Facades\Log;

class AdminNotificationHelper
{
    /**
     * Base method to create an admin notification for an application.
     */
    public static function createNotification(
        string $title,
        string $message,
        string $applicantId,
        ?string $applicantName = null,
        ?string $applicantEmail = null,
        string $type = 'info'
    ): ?AdminNotificationModel {
        try {
            return AdminNotificationModel::create([
                'title'           => $title,
                'message'         => $message,
                'type'            => $type,
                'applicant_id'    => $applicantId,
                'applicant_name'  => $applicantName,
                'applicant_email' => $applicantEmail,
                'is_read'         => false,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to create admin notification', [
                'applicant_id' => $applicantId,
                'error'        => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Notify administrators that a new application has been submitted.
     */
    public static function notifyApplicationSubmitted(ApplicationModel $application): ?AdminNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $title = 'New Application Submitted';
        $message = "A new membership application for '{$application->legal_name}' has been submitted by {$applicantName} and is awaiting review.";

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
     * Notify administrators that an application draft has been saved.
     */
    public static function notifyDraftSaved(ApplicationModel $application): ?AdminNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $title = 'Application Draft Saved';
        $message = "A draft application for '{$application->legal_name}' was initiated/saved by {$applicantName}.";

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
     * Notify administrators when an application status changes.
     */
    public static function notifyStatusUpdated(ApplicationModel $application, string $status): ?AdminNotificationModel
    {
        $title = 'Application Status Updated';
        $message = "Application for '{$application->legal_name}' status changed to '{$status}'.";

        $type = match (strtolower(trim($status))) {
            'approved'                                    => 'success',
            'rejected'                                    => 'error',
            'revision_required', 'revision required'      => 'warning',
            default                                       => 'info',
        };

        return self::createNotification(
            title: $title,
            message: $message,
            applicantId: $application->id,
            applicantName: $application->applicant_name ?: $application->legal_name,
            applicantEmail: $application->business_email,
            type: $type
        );
    }

    /**
     * Notify administrators when an application is deleted.
     */
    public static function notifyApplicationDeleted(
        string $legalName,
        string $applicantId,
        ?string $applicantName = null,
        ?string $applicantEmail = null
    ): ?AdminNotificationModel {
        $title = 'Application Deleted';
        $message = "Application for '{$legalName}' has been deleted.";

        return self::createNotification(
            title: $title,
            message: $message,
            applicantId: $applicantId,
            applicantName: $applicantName,
            applicantEmail: $applicantEmail,
            type: 'warning'
        );
    }
}
