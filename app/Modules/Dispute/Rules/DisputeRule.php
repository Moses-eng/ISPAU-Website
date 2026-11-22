<?php

namespace App\Modules\Dispute\Rules;

use Illuminate\Validation\Rule;

class DisputeRule
{
    public static function createRules(): array
    {
        return [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255',
            'reason'   => 'required|string',
            'recordId' => 'required|string|max:255',   // plain string, not uuid
        ];
    }

    public static function updateRules(string $disputeId): array
    {
        return [
            'name'     => 'sometimes|string|max:255',
            'email'    => ['sometimes', 'email', 'max:255'],
            'reason'   => 'sometimes|string',
            'recordId' => 'sometimes|string|max:255',
            'status'   => ['sometimes', Rule::in(['pending', 'reviewed', 'resolved', 'rejected'])],
        ];
    }
}
