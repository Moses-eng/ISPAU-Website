<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ClarificationRequestedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $applicantName;
    public string $organisationName;
    public string $subjectText;
    public array $items;
    public string $reviewerName;
    public string $appName;
    public string $supportEmail;
    public string $portalUrl;

    /**
     * @param array<int, string> $items
     */
    public function __construct(
        string $applicantName = 'Applicant',
        string $organisationName = 'Your Organisation',
        string $subjectText = 'Clarification requested on your membership application',
        array $items = [],
        string $reviewerName = 'ISPAU Membership Team'
    ) {
        $this->applicantName    = $applicantName ?: 'Applicant';
        $this->organisationName = $organisationName ?: 'Your Organisation';
        $this->subjectText      = $subjectText ?: 'Clarification requested';
        $this->items            = $items;
        $this->reviewerName     = $reviewerName ?: 'ISPAU Membership Team';
        $this->appName          = config('app.name', 'ISPAU');
        $this->supportEmail     = config('mail.from.address');
        $this->portalUrl        = config('app.frontend_url');
    }

    public function build(): self
    {
        return $this->subject("[{$this->appName}] Action Required: {$this->subjectText}")
                    ->view('emails.clarification-requested');
    }
}
