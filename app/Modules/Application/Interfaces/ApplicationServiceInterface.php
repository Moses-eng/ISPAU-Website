<?php

namespace App\Modules\Application\Interfaces;

use App\Modules\Application\DTOs\ApplicationActionResponseData;
use App\Modules\Application\DTOs\ApplicationRequestData;
use App\Modules\Application\Models\ApplicationModel;

interface ApplicationServiceInterface
{
    public function listAll(array $filters = []): ApplicationActionResponseData;
    public function show(string $id): ApplicationActionResponseData;
    public function create(ApplicationRequestData $data): ApplicationActionResponseData;
    public function saveDraft(ApplicationRequestData $data): ApplicationActionResponseData;
    public function update(ApplicationModel $application, ApplicationRequestData $data): ApplicationActionResponseData;
    public function delete(ApplicationModel $application): ApplicationActionResponseData;
    public function downloadSummaryPdf(string $id);
}
