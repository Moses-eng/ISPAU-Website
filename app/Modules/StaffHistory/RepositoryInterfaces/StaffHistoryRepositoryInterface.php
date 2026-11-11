<?php

namespace App\Modules\StaffHistory\RepositoryInterfaces;

use Illuminate\Support\Collection;

interface StaffHistoryRepositoryInterface
{
    /**
     * Return raw audit rows grouped by session_id for the given actors/date range.
     * Returns a collection keyed by session_id, each value an ordered array of rows.
     */
    public function sessions(array $actorIds, ?string $from, ?string $to, int $limit): Collection;
}
