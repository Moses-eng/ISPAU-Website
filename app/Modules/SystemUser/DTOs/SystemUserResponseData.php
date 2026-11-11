<?php

namespace App\Modules\SystemUser\DTOs;

use App\Modules\SystemUser\Models\SystemUserModel;

class SystemUserResponseData
{
    public function __construct(
        public readonly string  $id,
        public readonly string  $name,
        public readonly string  $email,
        public readonly string  $role,
        public readonly bool    $is_active,
        public readonly ?string $last_login_at = null,
        public readonly ?string $created_at = null,
    ) {}

    public static function fromModel(SystemUserModel $m): self
    {
        return new self(
            id:            $m->id,
            name:          $m->name,
            email:         $m->email,
            role:          $m->role,
            is_active:     (bool) $m->is_active,
            last_login_at: optional($m->last_login_at)->toIso8601String(),
            created_at:    optional($m->created_at)->toIso8601String(),
        );
    }

    public function toArray(): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'email'         => $this->email,
            'role'          => $this->role,
            'is_active'     => $this->is_active,
            'last_login_at' => $this->last_login_at,
            'created_at'    => $this->created_at,
        ];
    }
}
