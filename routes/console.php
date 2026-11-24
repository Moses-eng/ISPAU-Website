<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduling command definition
Schedule::command('subscriptions:check')->dailyAt('06:00')->withoutOverlapping()->onOneServer();


// ============================================================
// TESTING SCHEDULE — every minute (local/testing only)
// ============================================================
// Runs the same underlying command every minute so you can observe
// reminders/expiry processing without waiting for 06:00.
// Guarded by APP_ENV so it never fires in production.
if (app()->environment(['local', 'testing'])) {
    Schedule::command('subscriptions:check')
        ->everyMinute()
        ->withoutOverlapping()
        ->onOneServer()
        ->appendOutputTo(storage_path('logs/subscriptions-check-test.log'));
}


// Running it
# Terminal 1 — the scheduler worker
// php artisan schedule:work

// # Terminal 2 — watch output
// tail -f storage/logs/subscriptions-check-test.log

// Within 60 seconds you'll see the first pass. Each minute produces a block like:


// Running it
// You need the scheduler worker running (the schedule:run cron drives all entries, including this one):

// bash
// # Terminal 1 — the scheduler worker
// php artisan schedule:work

// # Terminal 2 — watch output
// tail -f storage/logs/subscriptions-check-test.log
// Within 60 seconds you'll see the first pass. Each minute produces a block like:

// text
// Running subscription checker…
// Reminders sent: 2
// Reminders failed: 0
// Subscriptions expired: 1
// Manual run (no scheduler needed)
// If you just want to invoke a single pass on demand — e.g. after seeding a test subscription that expires in exactly 7 days:

// bash
// php artisan subscriptions:check
// This bypasses the schedule entirely and runs the tracker once. Use this for one-shot verification; use schedule:work when you want to confirm the cron wiring itself works.

// Testing tip — fast-forward a subscription
// To trigger a specific reminder window immediately, adjust a test subscription's ends_at so its date lands on today + N:

// bash
// php artisan tinker
// php
// \App\Modules\Subscription\Models\SubscriptionModel::query()
//     ->where('status', 'active')
//     ->latest()
//     ->first()
//     ->update(['ends_at' => now()->addDays(7)->endOfDay()]);
// Then run php artisan subscriptions:check (or wait ≤60s for the scheduler). The whereDate('ends_at', now()->addDays(7)->toDateString()) query in SubscriptionRepository::dueForReminder(7, '7_days') will match, the reminder is sent, and a subscription_reminders row with reminder_type = '7_days' is created — confirming both delivery and the dedupe guard in one pass.

// Run it a second time immediately: Reminders sent: 0 for that window, because whereDoesntHave('reminders', ...) now excludes it. That's your end-to-end proof.

// Optional: a dedicated --dry-run flag
// If you want to test without actually sending emails (e.g. no mail credentials configured locally), add a --dry-run option to the command:

// php
// // app/Modules/Subscription/Console/CheckApplicantSubscriptions.php
// protected $signature = 'subscriptions:check {--dry-run : Preview reminders without sending mail}';
// …and short-circuit in SubscriptionTrackerService::run() when $dryRun is true (skip Mail::to(...), still report counts). Then:

// bash
// php artisan subscriptions:check --dry-run
// This is optional — the appendOutputTo log already gives you visibility into what's happening — but handy when you specifically want to verify the matching logic (which subscriptions are due, which are expired) without touching your mailer.
