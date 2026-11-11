<?php

namespace App\Modules\Application\RepositoryInterfaces;

use App\Modules\Application\Models\ReviewerModel;
use Illuminate\Database\Eloquent\Collection;

interface ReviewerRepositoryInterface
{
    public function findByApplication(string $applicationId): Collection;
    public function findById(string $id): ?ReviewerModel;
    public function existsFor(string $applicationId, string $reviewerId): bool;
    public function create(array $data): ReviewerModel;
    public function update(ReviewerModel $reviewer, array $data): ReviewerModel;
    public function delete(ReviewerModel $reviewer): bool;
}
