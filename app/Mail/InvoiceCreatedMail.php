<?php

namespace App\Mail;

use App\Modules\Invoice\Models\InvoiceModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoiceCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public InvoiceModel $invoice;
    public string $applicantName;
    public string $portalUrl;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        InvoiceModel $invoice,
        string $applicantName
    ) {
        $this->invoice       = $invoice;
        $this->applicantName = $applicantName;
        $this->portalUrl     = config('app.frontend_url');
        $this->appName       = config('app.name', 'ISPAU');
        $this->supportEmail  = config('mail.from.address',);
    }

    public function build(): self
    {
        $subject = "Invoice #{$this->invoice->invoice_number} Issued — {$this->appName} Membership";

        return $this->subject($subject)
                    ->view('emails.invoice-created');
    }
}
