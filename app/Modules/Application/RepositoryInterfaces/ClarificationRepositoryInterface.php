<?php

namespace App\Modules\Application\RepositoryInterfaces;

use App\Modules\Application\Models\ClarificationModel;
use Illuminate\Database\Eloquent\Collection;

interface ClarificationRepositoryInterface
{
    public function findByApplication(string $applicationId): Collection;
    public function findById(string $id): ?ClarificationModel;
    public function create(array $data): ClarificationModel;
    public function update(ClarificationModel $clarification, array $data): ClarificationModel;
    public function delete(ClarificationModel $clarification): bool;
    public function hasOpen(string $applicationId): bool;
}
