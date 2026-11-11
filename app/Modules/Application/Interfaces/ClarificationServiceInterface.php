<?php

namespace App\Modules\Application\Interfaces;

use App\Modules\Application\DTOs\ClarificationActionResponseData;
use App\Modules\Application\DTOs\ClarificationRequestData;
use App\Modules\Application\Models\ClarificationModel;

interface ClarificationServiceInterface
{
    public function listByApplication(string $applicationId): ClarificationActionResponseData;
    public function raise(ClarificationRequestData $data): ClarificationActionResponseData;
    public function respond(ClarificationModel $clarification, string $response, string $status = 'Responded'): ClarificationActionResponseData;
    public function close(ClarificationModel $clarification, string $status = 'Closed'): ClarificationActionResponseData;
}
