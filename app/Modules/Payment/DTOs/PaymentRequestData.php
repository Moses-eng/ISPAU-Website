<?php

namespace App\Modules\Payment\DTOs;

use Illuminate\Http\Request;

class PaymentRequestData
{
    public function __construct(
        public readonly ?string $invoice_id = null,
        public readonly ?string $applicant_id = null,
        public readonly ?string $created_by = null,
        public readonly ?float  $amount = null,
        public readonly ?string $status = null,
        public readonly ?string $period = null,
        public readonly ?string $paid_at = null,
        public readonly ?string $payment_reference = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            invoice_id:        $request->input('invoice_id'),
            applicant_id:      $request->input('applicant_id'),
            created_by:        $request->input('created_by'),
            amount:            $request->filled('amount') ? (float) $request->input('amount') : null,
            status:            $request->input('status'),
            period:            $request->input('period'),
            paid_at:           $request->input('paid_at'),
            payment_reference: $request->input('payment_reference'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'invoice_id'        => $this->invoice_id,
            'applicant_id'      => $this->applicant_id,
            'created_by'        => $this->created_by,
            'amount'            => $this->amount,
            'status'            => $this->status,
            'period'            => $this->period,
            'paid_at'           => $this->paid_at,
            'payment_reference' => $this->payment_reference,
        ], fn ($v) => ! is_null($v));
    }
}
