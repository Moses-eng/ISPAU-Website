<?php

namespace App\Modules\Subscription\Repositories;

use App\Modules\Subscription\Models\SubscriptionModel;
use App\Modules\Subscription\RepositoryInterfaces\SubscriptionRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class SubscriptionRepository implements SubscriptionRepositoryInterface
{
    public function __construct(private readonly SubscriptionModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery()->with(['applicant', 'invoice', 'payment']);

        if (! empty($filters['applicant_id'])) {
            $query->where('applicant_id', $filters['applicant_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $query->orderBy($filters['sort'] ?? 'created_at', $filters['order'] ?? 'desc');

        return $query->get();
    }

    public function findById(string $id): ?SubscriptionModel
    {
        return $this->model->with(['applicant', 'invoice', 'payment', 'reminders'])->find($id);
    }

    public function findActiveByApplicant(string $applicantId): ?SubscriptionModel
    {
        return $this->model
            ->where('applicant_id', $applicantId)
            ->where('status', 'active')
            ->orderByDesc('ends_at')
            ->first();
    }

    public function create(array $data): SubscriptionModel
    {
        return $this->model->create($data);
    }

    public function update(SubscriptionModel $subscription, array $data): SubscriptionModel
    {
        $subscription->update($data);
        return $subscription->fresh();
    }

    public function delete(SubscriptionModel $subscription): bool
    {
        return (bool) $subscription->delete();
    }

    public function dueForReminder(int $daysAhead, string $reminderType): Collection
    {
        $targetDate = now()->addDays($daysAhead)->startOfDay();

        return $this->model
            ->with(['applicant'])
            ->where('status', 'active')
            ->whereDate('ends_at', $targetDate->toDateString())
            ->whereDoesntHave('reminders', fn ($q) => $q->where('reminder_type', $reminderType))
            ->get();
    }

    public function expiredNotMarked(): Collection
    {
        return $this->model
            ->with(['applicant'])
            ->where('status', 'active')
            ->where('ends_at', '<', now())
            ->get();
    }
}
