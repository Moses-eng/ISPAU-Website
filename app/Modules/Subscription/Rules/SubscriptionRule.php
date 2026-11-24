<?php

namespace App\Modules\Subscription\Rules;

class SubscriptionRule
{
    public static function createRules(): array
    {
        return [
            'applicant_id' => 'required|uuid|exists:applications,id',
            'invoice_id'   => 'required|uuid|exists:invoices,id',
            'payment_id'   => 'nullable|uuid|exists:payments,payment_id',
            'status'       => 'sometimes|in:active,expired,cancelled',
        ];
    }
}
