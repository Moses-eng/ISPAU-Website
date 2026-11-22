<?php

namespace App\Modules\Invoice\DTOs;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class InvoiceRequestData
{
    public function __construct(
        public readonly ?string $applicant_id = null,
        public readonly ?float  $total = null,
        public readonly ?string $status = null,
        public readonly ?string $invoice_date = null,
        public readonly ?string $start_date = null,
        public readonly ?string $end_date = null,
        public readonly ?string $membership_period = null,
        public readonly ?string $confirmed_by = null,
        public readonly ?string $payment_status = null,
        public readonly ?UploadedFile $invoice_pdf = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            applicant_id:      $request->input('applicant_id'),
            total:             $request->filled('total') ? (float) $request->input('total') : null,
            status:            $request->input('status'),
            invoice_date:      $request->input('invoice_date'),
            start_date:        $request->input('start_date'),
            end_date:          $request->input('end_date'),
            membership_period: $request->input('membership_period'),
            confirmed_by:      $request->input('confirmed_by'),
            payment_status:    $request->input('payment_status'),
            invoice_pdf:       $request->file('invoice_pdf'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'applicant_id'      => $this->applicant_id,
            'total'             => $this->total,
            'status'            => $this->status,
            'invoice_date'      => $this->invoice_date,
            'start_date'        => $this->start_date,
            'end_date'          => $this->end_date,
            'membership_period' => $this->membership_period,
            'confirmed_by'      => $this->confirmed_by,
            'payment_status'    => $this->payment_status,
        ], fn ($v) => ! is_null($v));
    }
}
