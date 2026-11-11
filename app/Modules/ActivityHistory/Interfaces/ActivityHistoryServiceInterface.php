<?php

namespace App\Modules\ActivityHistory\Interfaces;

use App\Modules\ActivityHistory\DTOs\ActivityFilterRequestData;
use App\Modules\ActivityHistory\DTOs\ActivityListResponseData;
use App\Modules\SystemUser\Models\SystemUserModel;

interface ActivityHistoryServiceInterface
{
    public function listFor(SystemUserModel $viewer, ActivityFilterRequestData $filters): ActivityListResponseData;
    public function actorsFor(SystemUserModel $viewer): array;
}
