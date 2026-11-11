<?php

namespace App\Modules\StaffHistory\Interfaces;

use App\Modules\StaffHistory\DTOs\StaffSessionListResponseData;
use App\Modules\SystemUser\Models\SystemUserModel;

interface StaffHistoryServiceInterface
{
    public function listFor(
        SystemUserModel $viewer,
        ?string $person,
        ?string $from,
        ?string $to,
        int $limit = 100,
    ): StaffSessionListResponseData;
}
