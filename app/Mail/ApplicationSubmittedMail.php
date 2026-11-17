<?php

namespace App\Mail;

use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public ApplicationModel $app;
    public string $portalUrl;
    public bool $isInternalNotice;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        ApplicationModel $app,
        string $portalUrl,
        bool $isInternalNotice = false
    ) {
        $this->app              = $app;
        $this->portalUrl        = $portalUrl;
        $this->isInternalNotice = $isInternalNotice;
        $this->appName          = config('app.name', 'ISPAU');
        $this->supportEmail     = config('mail.from.address');
    }

    public function build(): self
    {
        $subject = $this->isInternalNotice
            ? "[{$this->appName} Admin] New Application Submitted: {$this->app->legal_name}"
            : "Application Submitted Successfully — {$this->appName} Membership";

        return $this->subject($subject)
                    ->view('emails.application-submitted');
    }
}
