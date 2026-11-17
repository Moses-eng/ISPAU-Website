<?php

namespace App\Modules\HeroSlide\RepositoryInterfaces;

use App\Modules\HeroSlide\Models\HeroSlideModel;
use Illuminate\Database\Eloquent\Collection;

interface HeroSlideRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function allPublicActive(): Collection;
    public function findById(string $id): ?HeroSlideModel;
    public function create(array $data): HeroSlideModel;
    public function update(HeroSlideModel $slide, array $data): HeroSlideModel;
    public function delete(HeroSlideModel $slide): bool;
}
