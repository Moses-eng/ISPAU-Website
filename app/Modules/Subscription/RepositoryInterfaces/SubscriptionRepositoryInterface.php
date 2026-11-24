<?php

namespace App\Modules\Subscription\RepositoryInterfaces;

use App\Modules\Subscription\Models\SubscriptionModel;
use Illuminate\Database\Eloquent\Collection;

interface SubscriptionRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?SubscriptionModel;
    public function findActiveByApplicant(string $applicantId): ?SubscriptionModel;
    public function create(array $data): SubscriptionModel;
    public function update(SubscriptionModel $subscription, array $data): SubscriptionModel;
    public function delete(SubscriptionModel $subscription): bool;

    /** For the scheduled checker: active subs whose ends_at falls within N days. */
    public function dueForReminder(int $daysAhead, string $reminderType): Collection;

    /** For the scheduled checker: active subs that have already expired. */
    public function expiredNotMarked(): Collection;
}
