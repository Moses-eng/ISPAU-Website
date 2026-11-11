<?php

namespace App\Modules\SystemUser\RepositoryInterfaces;

use App\Modules\SystemUser\Models\SystemUserModel;
use Illuminate\Database\Eloquent\Collection;

interface SystemUserRepositoryInterface
{
    public function create(array $data): SystemUserModel;
    public function all(array $filters = []): Collection;
    public function findByEmail(string $email): ?SystemUserModel;
    public function findById(string $id): ?SystemUserModel;
    public function emailExists(string $email): bool;
    public function updateLastLogin(SystemUserModel $user, ?string $ip = null): SystemUserModel;
    public function update(SystemUserModel $user, array $data): SystemUserModel;
    public function delete(SystemUserModel $user): bool;
}
