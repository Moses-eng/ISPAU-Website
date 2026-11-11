<?php

namespace App\Modules\Contact\Rules;

use Illuminate\Validation\Rule;

class ContactRule
{
    public static function createRules(): array
    {
        return [
            'name'         => 'required|string|max:255',
            'work_email'   => 'required|email|max:255',
            'organisation' => 'required|string|max:255',
            'message'      => 'required|string',
            'enquiry_type' => 'required|string|max:255',
            'status'       => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }

    public static function updateRules(string $contactId): array
    {
        return [
            'name'         => 'sometimes|string|max:255',
            'work_email'   => ['sometimes', 'email', 'max:255'],
            'organisation' => 'sometimes|string|max:255',
            'message'      => 'sometimes|string',
            'enquiry_type' => 'sometimes|string|max:255',
            'status'       => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ];
    }
}
