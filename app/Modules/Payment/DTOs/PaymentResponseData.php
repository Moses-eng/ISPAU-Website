<?php

namespace App\Modules\Payment\DTOs;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Payment\Models\PaymentModel;
use App\Modules\SystemUser\Models\SystemUserModel;

class PaymentResponseData
{
    public function __construct(
        public readonly string  $payment_id,
        public readonly string  $payment_no,
        public readonly string  $applicant_legal_name,
        public readonly string  $invoice_id,
        public readonly string  $applicant_id,
        public readonly ?string $created_by,
        public readonly string  $amount,
        public readonly string  $status,
        public readonly ?string $period,
        public readonly ?string $paid_at,
        public readonly ?string $payment_reference,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}

    public static function fromModel(
        PaymentModel $m,
        array $applicantNames = [],
        array $confirmedNames = [],
    ): self
    {
           // 1. Resolve applicant legal name
        $legalName = $applicantNames[$m->applicant_id]
            ?? ApplicationModel::getApplicateName($m->applicant_id)
            ?? 'Valued Applicant';

        // 2. Resolve confirmed by name (null if unconfirmed -> map lookup -> static DB fallback)
        $confirmedByName = null;
        if ($m->confirmed_by) {
            $confirmedByName = $confirmedNames[$m->confirmed_by]
                ?? SystemUserModel::getSystemUserName($m->confirmed_by);
        }

        return new self(
            payment_id:        $m->payment_id,
            payment_no:        (string) $m->payment_no,
            invoice_id:        $m->invoice_id,
            applicant_legal_name: $legalName,
            applicant_id:      $m->applicant_id,
            created_by:        $confirmedByName,
            amount:            (string) $m->amount,
            status:            $m->status,
            period:            $m->period,
            paid_at:           optional($m->paid_at)->toIso8601String(),
            payment_reference: $m->payment_reference,
            created_at:        optional($m->created_at)->toIso8601String(),
            updated_at:        optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'payment_id'        => $this->payment_id,
            'payment_no'        => $this->payment_no,
            'invoice_id'        => $this->invoice_id,
            'applicant_id'      => $this->applicant_id,
            'created_by'        => $this->created_by,
            'amount'            => $this->amount,
            'status'            => $this->status,
            'period'            => $this->period,
            'paid_at'           => $this->paid_at,
            'payment_reference' => $this->payment_reference,
            'created_at'        => $this->created_at,
            'updated_at'        => $this->updated_at,
        ];
    }
}
