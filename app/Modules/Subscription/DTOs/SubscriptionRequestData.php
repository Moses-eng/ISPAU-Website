<?php

namespace App\Modules\Subscription\DTOs;

use Illuminate\Http\Request;

class SubscriptionRequestData
{
    public function __construct(
        public readonly ?string $applicantId = null,
        public readonly ?string $invoiceId = null,
        public readonly ?string $paymentId = null,
        public readonly ?string $paymentConfirmedAt = null,
        public readonly ?string $startsAt = null,
        public readonly ?string $endsAt = null,
        public readonly string $status = 'active',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            applicantId:        $request->input('applicant_id'),
            invoiceId:          $request->input('invoice_id'),
            paymentId:          $request->input('payment_id'),
            paymentConfirmedAt: $request->input('payment_confirmed_at'),
            startsAt:           $request->input('starts_at'),
            endsAt:             $request->input('ends_at'),
            status:             (string) $request->input('status', 'active'),
        );
    }

    public function toArray(): array
    {
        return [
            'applicant_id'         => $this->applicantId,
            'invoice_id'           => $this->invoiceId,
            'payment_id'           => $this->paymentId,
            'payment_confirmed_at' => $this->paymentConfirmedAt,
            'starts_at'            => $this->startsAt,
            'ends_at'              => $this->endsAt,
            'status'               => $this->status,
        ];
    }
}
