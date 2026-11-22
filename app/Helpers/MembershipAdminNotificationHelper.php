<?php

namespace App\Helpers;

use App\Modules\AdminNotification\Models\AdminNotificationModel;
use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Contact\Models\ContactModel;
use Illuminate\Support\Facades\Log;

class MembershipAdminNotificationHelper
{
    /**
     * Base method to create a membership admin notification.
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
            Log::warning('Failed to create Membership Admin notification', [
                'applicant_id' => $applicantId,
                'error'        => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Notify Membership Admin of an incoming enquiry.
     */
    public static function notifyContactEnquiry(ContactModel $contact): ?AdminNotificationModel
    {
        $orgLabel = $contact->organisation ? " ({$contact->organisation})" : '';
        $title    = 'New Membership Enquiry';
        $message  = "New {$contact->enquiry_type} received from '{$contact->name}'{$orgLabel}.";

        return self::createNotification(
            title: $title,
            message: $message,
            applicantId: $contact->id,
            applicantName: $contact->name,
            applicantEmail: $contact->work_email,
            type: 'info'
        );
    }

    /**
     * Notify Membership Admin that a new application has been submitted.
     */
    public static function notifyApplicationSubmitted(ApplicationModel $application): ?AdminNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $title = 'New Membership Application Submitted';
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
     * Notify Membership Admin that an application draft has been saved.
     */
    public static function notifyDraftSaved(ApplicationModel $application): ?AdminNotificationModel
    {
        $applicantName = $application->applicant_name ?: $application->legal_name;
        $title = 'Application Draft Saved [Membership]';
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
     * Notify Membership Admin when an application status changes.
     */
    public static function notifyStatusUpdated(ApplicationModel $application, string $status): ?AdminNotificationModel
    {
        $title = 'Application Status Updated [Membership]';
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
     * Notify Membership Admin when an application is deleted.
     */
    public static function notifyApplicationDeleted(
        string $legalName,
        string $applicantId,
        ?string $applicantName = null,
        ?string $applicantEmail = null
    ): ?AdminNotificationModel {
        $title = 'Application Deleted [Membership]';
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
