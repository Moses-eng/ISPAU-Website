<?php

namespace App\Modules\Banner\RepositoryInterfaces;

use App\Modules\Banner\Models\BannerModel;
use Illuminate\Database\Eloquent\Collection;

interface BannerRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function allPublicActive(?string $pageName = null): Collection;
    public function findById(string $id): ?BannerModel;
    public function create(array $data): BannerModel;
    public function update(BannerModel $banner, array $data): BannerModel;
    public function delete(BannerModel $banner): bool;
}
