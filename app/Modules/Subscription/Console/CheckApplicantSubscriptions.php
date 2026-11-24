<?php

namespace App\Modules\Subscription\Console;

use App\Modules\Subscription\Services\SubscriptionTrackerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckApplicantSubscriptions extends Command
{
    protected $signature   = 'subscriptions:check';
    protected $description = 'Send subscription expiry reminders and expire lapsed subscriptions.';

    public function handle(SubscriptionTrackerService $tracker): int
    {
        $this->info('Running subscription checker…');

        $report = $tracker->run();

        $this->info("Reminders sent: {$report['reminders_sent']}");
        $this->info("Reminders failed: {$report['reminders_failed']}");
        $this->info("Subscriptions expired: {$report['expired']}");

        if (! empty($report['errors'])) {
            foreach ($report['errors'] as $err) {
                $this->error($err);
            }
        }

        Log::info('Subscription checker completed', $report);

        return self::SUCCESS;
    }
}
