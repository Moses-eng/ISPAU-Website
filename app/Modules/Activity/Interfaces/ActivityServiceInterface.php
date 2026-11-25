<?php

namespace App\Modules\Activity\Interfaces;

use App\Modules\Activity\DTOs\ActivityActionResponseData;
use App\Modules\Activity\DTOs\ActivityRequestData;
use App\Modules\Activity\Models\ActivityModel;
use Illuminate\Http\UploadedFile;

interface ActivityServiceInterface
{
    public function listAll(array $filters = []): ActivityActionResponseData;
    public function show(string $id): ActivityActionResponseData;
    public function create(ActivityRequestData $data, ?UploadedFile $image = null): ActivityActionResponseData;
    public function update(ActivityModel $activity, ActivityRequestData $data, ?UploadedFile $image = null): ActivityActionResponseData;
    public function delete(ActivityModel $activity): ActivityActionResponseData;
    public function listPublic(array $filters = []): ActivityActionResponseData;
    public function showBySlug(string $slug): ActivityActionResponseData;
}
