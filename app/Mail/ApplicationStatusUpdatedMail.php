<?php

namespace App\Mail;

use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public ApplicationModel $app;
    public string $status;
    public string $appName;
    public string $supportEmail;
    public string $portalUrl;

    public function __construct(ApplicationModel $app, string $status)
    {
        $this->app          = $app;
        $this->status       = $status;
        $this->appName      = config('app.name', 'ISPAU');
        $this->supportEmail = config('mail.from.address');
        $this->portalUrl    = config('app.frontend_url');
    }

    public function build(): self
    {
        return $this->subject("Application Status Update: {$this->status} — {$this->appName}")
                    ->view('emails.application-status-updated');
    }
}
