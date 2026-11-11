<?php

namespace App\Modules\Application\Rules;

class ReviewerRule
{
    public static function assignRules(): array
    {
        return [
            'applicationId'   => 'required|uuid|exists:applications,id',
            'reviewerId'      => 'required|uuid',
            'reviewerName'    => 'required|string|max:255',
            'assignedByName'  => 'nullable|string|max:255',
            'status'          => 'sometimes|in:Assigned,In review',
        ];
    }
}
