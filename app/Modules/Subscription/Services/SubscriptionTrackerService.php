<?php

namespace App\Modules\Subscription\Services;

use App\Mail\ApplicantSubscriptionReminderMail;
use App\Modules\Subscription\Models\SubscriptionModel;
use App\Modules\Subscription\Models\SubscriptionReminderModel;
use App\Modules\Subscription\RepositoryInterfaces\SubscriptionRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SubscriptionTrackerService
{
    /**
     * Reminder windows, in days-before-expiry => reminder_type label.
     */
    public const REMINDER_WINDOWS = [
        30 => '30_days',
        14 => '14_days',
        7  => '7_days',
        1  => '1_day',
    ];

    public function __construct(
        private readonly SubscriptionRepositoryInterface $repository,
    ) {}

    /**
     * Dispatch all due reminders and expire lapsed subscriptions.
     * Returns a small report array for the command to log.
     */
    public function run(): array
    {
        $report = [
            'reminders_sent'   => 0,
            'reminders_failed' => 0,
            'expired'          => 0,
            'errors'           => [],
        ];

        // 1. Send reminders for each window
        foreach (self::REMINDER_WINDOWS as $daysAhead => $reminderType) {
            $due = $this->repository->dueForReminder($daysAhead, $reminderType);

            foreach ($due as $subscription) {
                $ok = $this->sendReminder($subscription, $reminderType);
                $ok ? $report['reminders_sent']++ : $report['reminders_failed']++;
            }
        }

        // 2. Expire lapsed subscriptions
        foreach ($this->repository->expiredNotMarked() as $subscription) {
            $ok = $this->expire($subscription);
            $ok ? $report['expired']++ : $report['errors'][] = "Expire failed: {$subscription->id}";
        }

        return $report;
    }

    private function sendReminder(SubscriptionModel $subscription, string $reminderType): bool
    {
        $recipient = $subscription->applicant?->business_email;
        if (! $recipient) {
            Log::warning('Subscription reminder skipped: applicant has no business_email', [
                'subscription_id' => $subscription->id,
                'applicant_id'    => $subscription->applicant_id,
                'reminder_type'   => $reminderType,
            ]);
            return false;
        }

        try {
            Mail::to($recipient)->send(
                new ApplicantSubscriptionReminderMail($subscription, $reminderType)
            );

            // Record the send so we never send it again for this subscription
            SubscriptionReminderModel::create([
                'subscription_id' => $subscription->id,
                'reminder_type'   => $reminderType,
                'sent_at'         => now(),
            ]);

            Log::info('Subscription reminder sent', [
                'subscription_id' => $subscription->id,
                'recipient'       => $recipient,
                'reminder_type'   => $reminderType,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Subscription reminder failed', [
                'subscription_id' => $subscription->id,
                'recipient'       => $recipient,
                'reminder_type'   => $reminderType,
                'error'           => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function expire(SubscriptionModel $subscription): bool
    {
        try {
            $this->repository->update($subscription, ['status' => 'expired']);

            $recipient = $subscription->applicant?->business_email;
            if ($recipient) {
                Mail::to($recipient)->send(
                    new ApplicantSubscriptionReminderMail($subscription, 'expired')
                );

                SubscriptionReminderModel::firstOrCreate(
                    [
                        'subscription_id' => $subscription->id,
                        'reminder_type'   => 'expired',
                    ],
                    ['sent_at' => now()],
                );
            }

            Log::info('Subscription expired', [
                'subscription_id' => $subscription->id,
                'applicant_id'    => $subscription->applicant_id,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Subscription expiry failed', [
                'subscription_id' => $subscription->id,
                'error'           => $e->getMessage(),
            ]);
            return false;
        }
    }
}
