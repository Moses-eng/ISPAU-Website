<?php

namespace App\Mail;

use App\Modules\Application\Models\VerificationModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationRecordedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public VerificationModel $verification,
        public ?string $applicationNumber,
        public ?string $applicantName,
        public string $portalUrl,
        public string $appName = '',
        public string $supportEmail = ''
    ) {
        $this->appName      = config('app.name', 'ISPAU');
        $this->supportEmail = (string) config('mail.from.address');
    }

    public function build(): self
    {
        $subject = "Application Verification Update — {$this->appName} Membership"
            . ($this->applicationNumber ? " [{$this->applicationNumber}]" : "");

        return $this->subject($subject)
                    ->view('emails.application_verification_recorded');
    }
}
