<?php

namespace App\Modules\Activity\RepositoryInterfaces;

use App\Modules\Activity\Models\ActivityModel;
use Illuminate\Database\Eloquent\Collection;

interface ActivityRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?ActivityModel;
    public function findBySlug(string $slug): ?ActivityModel;
    public function create(array $data): ActivityModel;
    public function update(ActivityModel $activity, array $data): ActivityModel;
    public function delete(ActivityModel $activity): bool;
    public function allPublicPublished(array $filters = []): Collection;
}
