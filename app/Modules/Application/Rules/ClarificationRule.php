<?php

namespace App\Modules\Application\Rules;

class ClarificationRule
{
    public static function raiseRules(): array
    {
        return [
            'applicationId'  => 'required|uuid|exists:applications,id',
            'reviewerId'     => 'required|uuid',
            'reviewerName'   => 'required|string|max:255',
            'assignedByName' => 'nullable|string|max:255',
            'subject'        => 'required|string|max:255',
            'message'        => 'required|string|max:5000',
            'items'          => 'sometimes|array',
            'items.*'        => 'string|max:500',
        ];
    }

    public static function respondRules(): array
    {
        return [
            'response' => 'required|string|max:5000',
            'status'   => 'sometimes|in:Responded,Accepted,Rejected,Closed',
        ];
    }

    public static function closeRules(): array
    {
        return [
            'status' => 'sometimes|in:Accepted,Rejected,Closed',
        ];
    }
}
