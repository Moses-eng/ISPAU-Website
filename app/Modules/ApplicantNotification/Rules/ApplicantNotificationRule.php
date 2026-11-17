<?php

namespace App\Modules\ApplicantNotification\Rules;

use Illuminate\Validation\Rule;

class ApplicantNotificationRule
{
    public static function createRules(): array
    {
        return [
            'title'          => 'required|string|max:255',
            'message'        => 'required|string',
            'type'           => ['required', Rule::in(['info', 'warning', 'success', 'error'])],
            'applicant_id'   => 'required|integer|exists:applicants,id',
            'applicant_name' => 'nullable|string|max:255',
        ];
    }

    public static function bulkDeleteRules(): array
    {
        return [
            'ids'   => 'required|array',
            'ids.*' => 'integer|exists:applicant_notifications,id',
        ];
    }
}
