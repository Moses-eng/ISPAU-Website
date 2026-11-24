<?php

namespace App\Modules\Subscription\DTOs;

use App\Modules\Application\Models\ApplicationModel;
use App\Modules\Invoice\Models\InvoiceModel;
use App\Modules\Payment\Models\PaymentModel;
use App\Modules\Subscription\Models\SubscriptionModel;
use App\Modules\SystemUser\Models\SystemUserModel;

class SubscriptionResponseData
{
    public function __construct(
        public readonly string $id,
        public readonly string $applicantId,
        public readonly string $invoiceId,
        public readonly string  $applicant_legal_name,
        public readonly ?string $confirmed_by_name,
        public readonly string  $applicantion_number,
        public readonly string $applicant_email,
        public readonly string  $payment_number,
        public readonly string  $invoice_number,
        public readonly ?string $paymentId,
        public readonly ?string $paymentConfirmedAt,
        public readonly ?string $startsAt,
        public readonly ?string $endsAt,
        public readonly string $status,
        public readonly int $daysRemaining,
        public readonly ?string $createdAt = null,
        public readonly ?string $updatedAt = null,
    ) {}

    public static function fromModel(SubscriptionModel $m,
    array $applicantNames = [],
        array $applicantionNumbers = [],
        array $invoiceNumbers = [],
        array $emailNumber = [],
        array $ipaymentNumbers =[],
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
         // 3. Application Nuber
        $applicationNumber = $applicantionNumbers[$m->applicant_id]
            ?? ApplicationModel::getApplicationNumber($m->applicant_id)?? ' APP';

         // 3. Email Nuber
        $applicantEemail = $applicantionNumbers[$m->applicant_id]
            ?? ApplicationModel::getApplicateEmail($m->applicant_id)?? 'EMAIL';

         // 4. Invoice Nuber
        $invoiceNumber = $invoiceNumbers[$m->invoice_id]
            ?? InvoiceModel::getInvoiceNumber($m->invoice_id) ?? 'INV';

        // 4. Payment Nuber
        $paymentNumber = $ipaymentNumbers[$m->payment_id]
        ?? PaymentModel::getPaymentNumber($m->payment_id) ?? 'PAY';


        return new self(
            id:                 $m->id,
            applicantId:        $m->applicant_id,
            applicantion_number:   $applicationNumber,
            payment_number:   $paymentNumber,
            confirmed_by_name:    $confirmedByName,
            applicant_email: $applicantEemail,
            applicant_legal_name: $legalName,
            invoiceId:          $m->invoice_id,
            invoice_number:          $invoiceNumber,
            paymentId:          $m->payment_id,
            paymentConfirmedAt: optional($m->payment_confirmed_at)->toIso8601String(),
            startsAt:           optional($m->starts_at)->toIso8601String(),
            endsAt:             optional($m->ends_at)->toIso8601String(),
            status:             $m->status,
            daysRemaining:      $m->days_remaining,
            createdAt:          optional($m->created_at)->toIso8601String(),
            updatedAt:          optional($m->updated_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'                   => $this->id,
            'applicant_legal_name'=>$this->applicant_legal_name,
            'applicant_email'=>$this->applicant_email,
            'applicantion_number'=>$this->applicantion_number,
            'payment_number'=>$this->payment_number,
            'confirmed_by_name'=>$this->confirmed_by_name,
            'invoice_number'=>$this->invoice_number,
            // 'applicant_id'         => $this->applicantId,
            // 'invoice_id'           => $this->invoiceId,
            // 'payment_id'           => $this->paymentId,
            'payment_confirmed_at' => $this->paymentConfirmedAt,
            'starts_at'            => $this->startsAt,
            'ends_at'              => $this->endsAt,
            'status'               => $this->status,
            'days_remaining'       => $this->daysRemaining,
            'created_at'           => $this->createdAt,
            'updated_at'           => $this->updatedAt,
        ];
    }
}
