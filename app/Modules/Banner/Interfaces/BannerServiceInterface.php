<?php

namespace App\Modules\Banner\Interfaces;

use App\Modules\Banner\DTOs\BannerActionResponseData;
use App\Modules\Banner\DTOs\BannerRequestData;
use App\Modules\Banner\Models\BannerModel;
use Illuminate\Http\UploadedFile;

interface BannerServiceInterface
{
    public function listAll(array $filters = []): BannerActionResponseData;
    public function listPublic(?string $pageName = null): BannerActionResponseData;
    public function show(string $id): BannerActionResponseData;
    public function create(BannerRequestData $data, UploadedFile $image): BannerActionResponseData;
    public function update(BannerModel $banner, BannerRequestData $data, ?UploadedFile $image = null): BannerActionResponseData;
    public function delete(BannerModel $banner): BannerActionResponseData;
}
