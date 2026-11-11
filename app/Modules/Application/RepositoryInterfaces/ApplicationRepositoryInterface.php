<?php

namespace App\Modules\Application\RepositoryInterfaces;

use App\Modules\Application\Models\ApplicationModel;
use Illuminate\Database\Eloquent\Collection;

interface ApplicationRepositoryInterface
{
    public function all(array $filters = []): Collection;
    public function findById(string $id): ?ApplicationModel;
    public function create(array $data): ApplicationModel;
    public function update(ApplicationModel $application, array $data): ApplicationModel;
    public function delete(ApplicationModel $application): bool;
}
