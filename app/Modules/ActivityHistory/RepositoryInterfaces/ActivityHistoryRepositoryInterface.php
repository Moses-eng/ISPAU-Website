<?php

namespace App\Modules\ActivityHistory\RepositoryInterfaces;

use App\Modules\ActivityHistory\DTOs\ActivityFilterRequestData;
use App\Modules\ActivityHistory\Models\AuditEventModel;
use Illuminate\Database\Eloquent\Collection;

interface ActivityHistoryRepositoryInterface
{
    /** @return Collection<int, AuditEventModel> */
    public function search(ActivityFilterRequestData $filters, array $allowedAreas): Collection;

    /** Distinct actors seen in the filtered window (for the Account dropdown). */
    public function actors(array $allowedAreas): array;
}
