<?php

namespace App\Modules\Application\Repositories;

use App\Modules\Application\Models\ClarificationModel;
use App\Modules\Application\RepositoryInterfaces\ClarificationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ClarificationRepository implements ClarificationRepositoryInterface
{
    public function __construct(private readonly ClarificationModel $model) {}

    public function findByApplication(string $applicationId): Collection
    {
        return $this->model
            ->newQuery()
            ->where('application_id', $applicationId)
            ->orderByDesc('requested_at')
            ->get();
    }

    public function findById(string $id): ?ClarificationModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): ClarificationModel
    {
        return $this->model->create($data);
    }

    public function update(ClarificationModel $clarification, array $data): ClarificationModel
    {
        $clarification->update($data);
        return $clarification->fresh();
    }

    public function delete(ClarificationModel $clarification): bool
    {
        return (bool) $clarification->delete();
    }

    public function hasOpen(string $applicationId): bool
    {
        return $this->model
            ->newQuery()
            ->where('application_id', $applicationId)
            ->where('status', 'Open')
            ->exists();
    }
}
