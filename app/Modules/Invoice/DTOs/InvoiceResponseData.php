<?php

namespace App\Modules\Invoice\DTOs;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\SystemUser\Models\SystemUserModel;

class InvoiceResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $applicant_id,
        public readonly string  $applicant_legal_name,
        public readonly string  $applicantion_number,
        public readonly string  $invoice_number,
        public readonly string  $total,
        public readonly string  $status,
        public readonly ?string $invoice_date,
        public readonly ?string $start_date,
        public readonly ?string $end_date,
        public readonly ?string $invoice_pdf,
        public readonly ?string $membership_period,
        public readonly ?string $confirmed_by,
        public readonly ?string $confirmed_by_name,
        public readonly string  $payment_status,
        public readonly ?string $created_at = null,
        public readonly ?string $updated_at = null,
    ) {}


    public static function fromModel(
        InvoiceModel $m,
        array $applicantNames = [],
        array $applicantionNumbers = [],
        array $confirmedNames = [],
    ): self {
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
         // 3. Application Nuber
        $applicationNumber = $applicantionsNumbers[$m->applicant_id]
            ?? ApplicationModel::getApplicationNumber($m->applicant_id)
            ?? ' APP';


        return new self(
            id:                   $m->id,
            applicant_id:         $m->applicant_id,
            applicantion_number:   $applicationNumber,
            applicant_legal_name: $legalName,
            invoice_number:       $m->invoice_number,
            total:                (string) $m->total,
            status:               $m->status,
            invoice_date:         optional($m->invoice_date)->toDateString(),
            start_date:           optional($m->start_date)->toDateString(),
            end_date:             optional($m->end_date)->toDateString(),
            invoice_pdf:          $m->invoice_pdf,
            membership_period:    $m->membership_period,
            confirmed_by:         $m->confirmed_by,
            confirmed_by_name:    $confirmedByName,
            payment_status:       $m->payment_status,
            created_at:           optional($m->created_at)->toIso8601String(),
            updated_at:           optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'                   => $this->id,
            'applicant_id'         => $this->applicant_id,
            'applicant_legal_name' => $this->applicant_legal_name,
            'invoice_number'       => $this->invoice_number,
            'applicantion_number'       => $this->applicantion_number,
            'total'                => $this->total,
            'status'               => $this->status,
            'invoice_date'         => $this->invoice_date,
            'start_date'           => $this->start_date,
            'end_date'             => $this->end_date,
            'invoice_pdf'          => $this->invoice_pdf,
            'membership_period'    => $this->membership_period,
            'confirmed_by'         => $this->confirmed_by,
            'confirmed_by_name'    => $this->confirmed_by_name,
            'payment_status'       => $this->payment_status,
            'created_at'           => $this->created_at,
            'updated_at'           => $this->updated_at,
        ];
    }
}
