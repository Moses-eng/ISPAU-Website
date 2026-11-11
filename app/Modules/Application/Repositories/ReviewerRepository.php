<?php

namespace App\Modules\Application\Repositories;

use App\Modules\Application\Models\ReviewerModel;
use App\Modules\Application\RepositoryInterfaces\ReviewerRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ReviewerRepository implements ReviewerRepositoryInterface
{
    public function __construct(private readonly ReviewerModel $model) {}

    public function findByApplication(string $applicationId): Collection
    {
        return $this->model
            ->newQuery()
            ->where('application_id', $applicationId)
            ->orderByDesc('assigned_at')
            ->get();
    }

    public function findById(string $id): ?ReviewerModel
    {
        return $this->model->find($id);
    }

    public function existsFor(string $applicationId, string $reviewerId): bool
    {
        return $this->model
            ->newQuery()
            ->where('application_id', $applicationId)
            ->where('reviewer_id', $reviewerId)
            ->whereIn('status', ['Assigned', 'In review'])
            ->exists();
    }

    public function create(array $data): ReviewerModel
    {
        return $this->model->create($data);
    }

    public function update(ReviewerModel $reviewer, array $data): ReviewerModel
    {
        $reviewer->update($data);
        return $reviewer->fresh();
    }

    public function delete(ReviewerModel $reviewer): bool
    {
        return (bool) $reviewer->delete();
    }
}
