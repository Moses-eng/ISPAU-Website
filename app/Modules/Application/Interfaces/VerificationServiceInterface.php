<?php

namespace App\Modules\Application\Interfaces;

use App\Modules\Application\DTOs\VerificationActionResponseData;
use App\Modules\Application\DTOs\VerificationRequestData;

interface VerificationServiceInterface
{
    public function listByApplication(string $applicationId): VerificationActionResponseData;
    public function record(VerificationRequestData $data): VerificationActionResponseData;
}
