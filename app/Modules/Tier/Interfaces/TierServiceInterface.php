<?php

namespace App\Modules\Tier\Interfaces;

use App\Modules\Tier\DTOs\TierActionResponseData;
use App\Modules\Tier\DTOs\TierPublicListResponseData;
use App\Modules\Tier\DTOs\TierRequestData;
use App\Modules\Tier\Models\TierModel;

interface TierServiceInterface
{
    public function listAll(array $filters = []): TierActionResponseData;
    public function show(string $id): TierActionResponseData;
    public function create(TierRequestData $data): TierActionResponseData;
    public function update(TierModel $tier, TierRequestData $data): TierActionResponseData;
    public function delete(TierModel $tier): TierActionResponseData;
    public function listPublic(): TierPublicListResponseData;
}
