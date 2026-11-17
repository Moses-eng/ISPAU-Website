<?php

namespace App\Modules\HeroSlide\Interfaces;

use App\Modules\HeroSlide\DTOs\HeroSlideActionResponseData;
use App\Modules\HeroSlide\DTOs\HeroSlideRequestData;
use App\Modules\HeroSlide\Models\HeroSlideModel;
use Illuminate\Http\UploadedFile;

interface HeroSlideServiceInterface
{
    public function listAll(array $filters = []): HeroSlideActionResponseData;
    public function listPublic(): HeroSlideActionResponseData;
    public function show(string $id): HeroSlideActionResponseData;
    public function create(HeroSlideRequestData $data, UploadedFile $image): HeroSlideActionResponseData;
    public function update(HeroSlideModel $slide, HeroSlideRequestData $data, ?UploadedFile $image = null): HeroSlideActionResponseData;
    public function delete(HeroSlideModel $slide): HeroSlideActionResponseData;
}
