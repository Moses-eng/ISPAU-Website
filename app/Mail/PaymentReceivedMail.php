<?php

namespace App\Mail;

use App\Modules\Payment\Models\PaymentModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentReceivedMail extends Mailable
{
    use Queueable, SerializesModels;

    public PaymentModel $payment;
    public string $applicantName;
    public string $portalUrl;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        PaymentModel $payment,
        string $applicantName
    ) {
        $this->payment       = $payment;
        $this->applicantName = $applicantName;
        $this->portalUrl     = config('app.frontend_url');
        $this->appName       = config('app.name', 'ISPAU');
        $this->supportEmail  = config('mail.from.address',);
    }

    public function build(): self
    {
        $subject = "Payment Receipt #{$this->payment->payment_no} Received — {$this->appName}";

        return $this->subject($subject)
                    ->view('emails.payment-received');
    }
}
