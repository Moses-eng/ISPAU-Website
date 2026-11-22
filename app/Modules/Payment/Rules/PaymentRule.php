<?php

namespace App\Modules\Payment\Rules;

use App\Modules\SystemUser\Rules\FinanceAdminRule;
use Illuminate\Validation\Rule;

class PaymentRule
{
    public static function createRules(): array
    {
        return [
            'invoice_id'        => 'required|uuid|exists:invoices,id',
            'applicant_id'      => 'required|uuid|exists:applications,id',
            'created_by'        => ['nullable', 'uuid', new FinanceAdminRule()],
            'amount'            => 'required|numeric|min:0',
            'status'            => ['sometimes', Rule::in(['active', 'not active'])],
            'period'            => 'nullable|string|max:255',
            'paid_at'           => 'nullable|date',
            'payment_reference' => 'nullable|string|max:255',
        ];
    }

    public static function updateRules(string $paymentId): array
    {
        return [
            'invoice_id'        => 'sometimes|uuid|exists:invoices,id',
            'applicant_id'      => 'sometimes|uuid|exists:applications,id',
            'created_by'        => ['nullable', 'uuid', new FinanceAdminRule()],
            'amount'            => 'sometimes|numeric|min:0',
            'status'            => ['sometimes', Rule::in(['active', 'not active'])],
            'period'            => 'nullable|string|max:255',
            'paid_at'           => 'nullable|date',
            'payment_reference' => 'nullable|string|max:255',
        ];
    }
}
