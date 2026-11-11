<?php

namespace App\Modules\Application\Repositories;

use App\Modules\Application\Models\VerificationModel;
use App\Modules\Application\RepositoryInterfaces\VerificationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class VerificationRepository implements VerificationRepositoryInterface
{
    public function __construct(private readonly VerificationModel $model) {}

    public function findByApplication(string $applicationId): Collection
    {
        return $this->model
            ->newQuery()
            ->where('application_id', $applicationId)
            ->orderByDesc('recorded_at')
            ->get();
    }

    public function findById(string $id): ?VerificationModel
    {
        return $this->model->find($id);
    }

    public function create(array $data): VerificationModel
    {
        return $this->model->create($data);
    }

    public function markSuperseded(string $applicationId): void
    {
        $this->model
            ->newQuery()
            ->where('application_id', $applicationId)
            ->where('status', 'Recorded')
            ->update(['status' => 'Superseded']);
    }
}
