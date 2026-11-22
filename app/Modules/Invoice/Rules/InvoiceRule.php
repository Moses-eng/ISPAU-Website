<?php

namespace App\Modules\Invoice\Rules;

use App\Modules\SystemUser\Rules\FinanceAdminRule;
use Illuminate\Validation\Rule;

class InvoiceRule
{
    public static function createRules(): array
    {
        return [
            'applicant_id'      => 'required|uuid|exists:applications,id',
            'total'             => 'required|numeric|min:0',
            'status'            => ['sometimes', Rule::in(['active', 'not active'])],
            'invoice_date'      => 'required|date',
            'membership_period' => 'nullable|string|max:255',
            'invoice_date'      => 'required|date',
            'start_date'        => 'nullable|date',
            'confirmed_by'      => ['nullable', 'uuid', new FinanceAdminRule()],
            'payment_status'    => ['sometimes', Rule::in(['Confirmed', 'Pending'])],
            'invoice_pdf'       => 'nullable|file|mimes:pdf|max:10240', // 10 MB
        ];
    }

    public static function updateRules(string $invoiceId): array
    {
        return [
            'applicant_id'      => 'sometimes|uuid|exists:applications,id',
            'total'             => 'sometimes|numeric|min:0',
            'status'            => ['sometimes', Rule::in(['active', 'not active'])],
            'invoice_date'      => 'sometimes|date',
            'invoice_date'      => 'required|date',
            'start_date'        => 'nullable|date',
            'membership_period' => 'nullable|string|max:255',
            'confirmed_by'      => ['nullable', 'uuid', new FinanceAdminRule()],
            'payment_status'    => ['sometimes', Rule::in(['Confirmed', 'Pending'])],
            'invoice_pdf'       => 'nullable|file|mimes:pdf|max:10240',
        ];
    }
}

