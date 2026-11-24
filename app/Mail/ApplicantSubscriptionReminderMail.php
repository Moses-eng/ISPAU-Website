<?php

namespace App\Mail;

use App\Modules\Subscription\Models\SubscriptionModel;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicantSubscriptionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SubscriptionModel $subscription,
        public string $reminderType,
    ) {}

    public function build(): self
    {
        $applicant = $this->subscription->applicant;
        $name      = $applicant?->legal_name ?? 'Valued Applicant';
        $appName   = config('app.name', 'ISPAU');

        $subject = $this->reminderType === 'expired'
            ? "Your {$appName} Subscription Has Expired"
            : "{$appName} Subscription Renewal Reminder — " .
              ucfirst(str_replace('_', ' ', $this->reminderType)) . ' to Expiry';

        return $this->subject($subject)
            ->view('emails.subscription-reminder')
            ->with([
                'subscription' => $this->subscription,
                'reminderType' => $this->reminderType,
                'applicantName'=> $name,
                'appName'      => $appName,
            ]);
    }
}
