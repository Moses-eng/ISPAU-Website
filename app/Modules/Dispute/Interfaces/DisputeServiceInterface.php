<?php

namespace App\Modules\Dispute\Interfaces;

use App\Modules\Dispute\DTOs\DisputeActionResponseData;
use App\Modules\Dispute\DTOs\DisputeRequestData;
use App\Modules\Dispute\Models\DisputeModel;

interface DisputeServiceInterface
{
    public function listAll(array $filters = []): DisputeActionResponseData;
    public function show(string $id): DisputeActionResponseData;
    public function create(DisputeRequestData $data): DisputeActionResponseData;
    public function update(DisputeModel $dispute, DisputeRequestData $data): DisputeActionResponseData;
    public function delete(DisputeModel $dispute): DisputeActionResponseData;
}
