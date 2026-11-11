<?php

namespace App\Modules\Application\Rules;
use Illuminate\Validation\Rule;

class VerificationRule
{
    private const RESULTS = ['Verified', 'Clarification needed', 'Not applicable'];

    public static function recordRules(): array
    {
        return [
            'applicationId'  => 'required|uuid|exists:applications,id',
            'reviewerId'     => 'required|uuid',
            'reviewerName'   => 'required|string|max:255',
            'assignedByName' => 'nullable|string|max:255',

            // dialog field names — kept identical to the form
            'result-0' => ['required',Rule::in(self::RESULTS)],
            'note-0'   => 'required|string|max:2000',
            'result-1' => ['required',Rule::in(self::RESULTS)],
            'note-1'   => 'required|string|max:2000',
            'result-2' => ['required',Rule::in(self::RESULTS)],
            'note-2'   => 'required|string|max:2000',
        ];
    }
}
