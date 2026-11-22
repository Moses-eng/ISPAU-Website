<?php

namespace App\Modules\Dispute\RepositoryInterfaces;

use App\Modules\Dispute\Models\DisputeModel;
use Illuminate\Database\Eloquent\Collection;

interface DisputeRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?DisputeModel;
    public function create(array $data): DisputeModel;
    public function update(DisputeModel $dispute, array $data): DisputeModel;
    public function delete(DisputeModel $dispute): bool;
}
