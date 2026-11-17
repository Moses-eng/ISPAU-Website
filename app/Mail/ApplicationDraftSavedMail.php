<?php

namespace App\Mail;

use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationDraftSavedMail extends Mailable
{
    use Queueable, SerializesModels;

    public ApplicationModel $app;
    public string $appName;
    public string $supportEmail;
    public string $portalUrl;

    public function __construct(ApplicationModel $app)
    {
        $this->app          = $app;
        $this->appName      = config('app.name', 'ISPAU');
        $this->supportEmail = config('mail.from.address');
        $this->portalUrl    = config('app.frontend_url');
    }

    public function build(): self
    {
        return $this->subject("Your {$this->appName} Membership Application Draft Has Been Saved")
                    ->view('emails.application-draft-saved');
    }
}
