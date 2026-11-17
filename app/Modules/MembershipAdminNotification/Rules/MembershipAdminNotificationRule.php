<?php

namespace App\Modules\MembershipAdminNotification\Rules;

use Illuminate\Validation\Rule;

class MembershipAdminNotificationRule
{
    public static function createRules(): array
    {
        return [
            'title'           => 'required|string|max:255',
            'message'         => 'required|string',
            'type'            => ['required', Rule::in(['info', 'warning', 'success', 'error'])],
            'applicant_id'    => 'required|uuid|exists:applications,id',
            'applicant_name'  => 'nullable|string|max:255',
            'applicant_email' => 'nullable|email|max:255',
        ];
    }

    public static function bulkDeleteRules(): array
    {
        return [
            'ids'   => 'required|array',
            'ids.*' => 'uuid|exists:membership_admin_notifications,id',
        ];
    }
}
