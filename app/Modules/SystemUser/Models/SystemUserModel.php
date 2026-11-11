<?php

namespace App\Modules\SystemUser\Models;

use App\Providers\JwtAuthenticatable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SystemUserModel extends JwtAuthenticatable
{
    use HasUuids;

    protected $table = 'system_users';

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'is_active', 'last_login_at', 'last_login_ip',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function getUserType(): string
    {
        return 'system';
    }

    // Role helpers
    public function isSuperAdmin(): bool      { return $this->role === 'super_admin'; }
    public function isFinanceAdmin(): bool    { return $this->role === 'finance_admin'; }
    public function isMembershipAdmin(): bool { return $this->role === 'membership_admin'; }

    public function getInitialsAttribute(): string
    {
        $parts = preg_split('/\s+/', trim($this->name));
        $initials = '';
        foreach (array_slice($parts, 0, 2) as $p) {
            $initials .= strtoupper(substr($p, 0, 1));
        }
        return $initials ?: 'S';
    }
}
