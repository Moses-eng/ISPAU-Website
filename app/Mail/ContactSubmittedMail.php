<?php

namespace App\Mail;

use App\Modules\Contact\Models\ContactModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContactSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public ContactModel $contact;
    public string $portalUrl;
    public bool $isInternalNotice;
    public string $appName;
    public string $supportEmail;

    public function __construct(
        ContactModel $contact,
        string $portalUrl,
        bool $isInternalNotice = false
    ) {
        $this->contact          = $contact;
        $this->portalUrl        = $portalUrl;
        $this->isInternalNotice = $isInternalNotice;
        $this->appName          = config('app.name', 'ISPAU');
        $this->supportEmail     = config('mail.from.address', 'info@ispau.ug');
    }

    public function build(): self
    {
        $org = $this->contact->organisation ? " ({$this->contact->organisation})" : '';

        $subject = $this->isInternalNotice
            ? "[{$this->appName} Admin] New Contact Enquiry: {$this->contact->name}{$org}"
            : "Thank you for contacting {$this->appName} — Enquiry Received";

        return $this->subject($subject)
                    ->view('emails.contact-submitted');
    }
}
