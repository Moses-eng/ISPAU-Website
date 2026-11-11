<?php

namespace App\Modules\Application\RepositoryInterfaces;

use App\Modules\Application\Models\VerificationModel;
use Illuminate\Database\Eloquent\Collection;

interface VerificationRepositoryInterface
{
    public function findByApplication(string $applicationId): Collection;
    public function findById(string $id): ?VerificationModel;
    public function create(array $data): VerificationModel;
    public function markSuperseded(string $applicationId): void;
}
