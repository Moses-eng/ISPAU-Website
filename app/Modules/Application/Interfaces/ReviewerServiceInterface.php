<?php

namespace App\Modules\Application\Interfaces;

use App\Modules\Application\DTOs\ReviewerActionResponseData;
use App\Modules\Application\DTOs\ReviewerRequestData;
use App\Modules\Application\Models\ReviewerModel;

interface ReviewerServiceInterface
{
    public function listByApplication(string $applicationId): ReviewerActionResponseData;
    public function assign(ReviewerRequestData $data): ReviewerActionResponseData;
    public function withdraw(ReviewerModel $reviewer): ReviewerActionResponseData;
}
