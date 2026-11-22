<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReceiptUploadedFinanceMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $invoiceNumber;
    public string $applicantName;
    public ?string $applicantEmail;
    public string $portalUrl;
    public string $appName;

    public function __construct(
        string $invoiceNumber,
        string $applicantName,
        ?string $applicantEmail = null
    ) {
        $this->invoiceNumber  = $invoiceNumber;
        $this->applicantName  = $applicantName;
        $this->applicantEmail = $applicantEmail;
        $this->appName        = config('app.name', 'ISPAU');
        $this->portalUrl = config('app.admin_frontend_url');
    }

    public function build(): self
    {
        $subject = "[{$this->appName} Finance] Proof of Payment Uploaded: Invoice #{$this->invoiceNumber}";

        return $this->subject($subject)
                    ->view('emails.receipt-uploaded-admin');
    }
}
