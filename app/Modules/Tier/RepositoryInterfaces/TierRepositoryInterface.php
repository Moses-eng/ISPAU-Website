<?php

namespace App\Modules\Tier\RepositoryInterfaces;

use App\Modules\Tier\Models\TierModel;
use Illuminate\Database\Eloquent\Collection;

interface TierRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?TierModel;
    public function create(array $data): TierModel;
    public function update(TierModel $tier, array $data): TierModel;
    public function delete(TierModel $tier): bool;
    public function allPublicActive():Collection;
}
