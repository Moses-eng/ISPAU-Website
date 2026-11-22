<?php

namespace App\Mail;

use App\Modules\Dispute\Models\DisputeModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DisputeSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public DisputeModel $dispute;
    public string $portalUrl;
    public bool $isInternalNotice;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        DisputeModel $dispute,
        string $portalUrl,
        bool $isInternalNotice = false
    ) {
        $this->dispute          = $dispute;
        $this->portalUrl        = $portalUrl;
        $this->isInternalNotice = $isInternalNotice;
        $this->appName          = config('app.name', 'ISPAU');
        $this->supportEmail     = config('mail.from.address', 'info@ispau.ug');
    }

    public function build(): self
    {
        $caseRef = $this->dispute->recordId ? " [Ref: {$this->dispute->recordId}]" : '';

        $subject = $this->isInternalNotice
            ? "[{$this->appName} Admin] New Dispute/Appeal Submitted: {$this->dispute->name}{$caseRef}"
            : "Dispute / Request Recorded Successfully — {$this->appName}";

        return $this->subject($subject)
                    ->view('emails.dispute-submitted');
    }
}
