<?php

namespace App\Modules\SystemUser\Repositories;

use App\Modules\SystemUser\Models\SystemUserModel;
use App\Modules\SystemUser\RepositoryInterfaces\SystemUserRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class SystemUserRepository implements SystemUserRepositoryInterface
{
    public function __construct(private readonly SystemUserModel $model) {}

    public function all(array $filters = []): Collection
    {
        $query = $this->model->newQuery();

        // ---- Search across name / email ----
        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('name',  'like', "%{$search}%")
                  ->orWhere('email','like', "%{$search}%");
            });
        }

        // ---- Filter by role ----
        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        // ---- Filter by active/inactive ----
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        // ---- Sorting ----
        $sort  = $filters['sort']  ?? 'created_at';
        $order = $filters['order'] ?? 'desc';
        $query->orderBy($sort, $order);

        return $query->get();
    }

    public function create(array $data): SystemUserModel
    {
        $data['password']  = Hash::make($data['password']);
        $data['is_active'] = true;

        return $this->model->create($data);
    }

    public function findByEmail(string $email): ?SystemUserModel
    {
        return $this->model->where('email', $email)->first();
    }

    public function findById(string $id): ?SystemUserModel
    {
        return $this->model->find($id);
    }

    public function emailExists(string $email): bool
    {
        return $this->model->where('email', $email)->exists();
    }

    public function updateLastLogin(SystemUserModel $user, ?string $ip = null): SystemUserModel
    {
        $user->last_login_at = now();
        $user->last_login_ip = $ip;
        $user->save();
        return $user;
    }

    public function update(SystemUserModel $user, array $data): SystemUserModel
    {
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        return $user->fresh();
    }

    public function delete(SystemUserModel $user): bool
    {
        return (bool) $user->delete();
    }
}
