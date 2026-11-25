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
    public string $status;
    public string $portalUrl;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        PaymentModel $payment,
        string $applicantName,
        string $status = 'Active'
    ) {
        $this->payment       = $payment;
        $this->applicantName = $applicantName;
        $this->status        = $status;
        $this->portalUrl     = (string) config('app.frontend_url', env('FRONTEND_URL', ''));
        $this->appName       = (string) config('app.name', 'ISPAU');
        $this->supportEmail  = (string) config('mail.from.address', '');
    }

    public function build(): self
    {
        $subject = "Payment Receipt #{$this->payment->payment_no} Received — {$this->appName}";

        return $this->subject($subject)
                    ->view('emails.payment-received');
    }
}
