<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicantOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $code;
    public string $applicantName;
    public string $organisationName;
    public int $ttlMinutes;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        string $code,
        string $applicantName = 'Applicant',
        string $organisationName = 'Your Organisation',
        int $ttlMinutes = 10
    ) {
        $this->code             = $code;
        $this->applicantName    = $applicantName;
        $this->organisationName = $organisationName;
        $this->ttlMinutes       = $ttlMinutes;
        $this->appName          = config('app.name', 'ISPAU');
        $this->supportEmail     = config('mail.from.address');
    }

    public function build(): self
    {
        return $this->subject('Your ' . $this->appName . ' Membership Application Login Code')
                    ->view('emails.applicant-otp');
    }
}
