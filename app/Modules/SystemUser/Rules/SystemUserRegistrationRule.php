<?php

namespace App\Modules\SystemUser\Rules;

use Illuminate\Validation\Rule;

class SystemUserRegistrationRule
{
    public static function rules(): array
    {
        return [
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:system_users,email',
            'password' => 'required|string|min:6|confirmed',
            'role'     => ['sometimes', Rule::in(['super_admin', 'finance_admin', 'membership_admin'])],
        ];
    }

    public static function updateRules(string $userId): array
    {
        return [
            'name'      => 'sometimes|string|max:255',
            'email'     => ['sometimes', 'email', Rule::unique('system_users', 'email')->ignore($userId)],
            'password'  => 'sometimes|string|min:6|confirmed',
            'role'      => ['sometimes', Rule::in(['super_admin', 'finance_admin', 'membership_admin'])],
            'is_active' => 'sometimes|boolean',
        ];
    }

    public static function loginRules(): array
    {
        return [
            'email'    => 'required|email',
            'password' => 'required|string',
        ];
    }
    public static function updatePasswordRules(): array
    {
        return [
            'current_password'      => 'required|string',
            'password'              => 'required|string|min:6|confirmed|different:current_password',
            'password_confirmation' => 'required|string',
        ];
    }
    public static function resetPasswordRules(): array
    {
        return [
            'updateId'              => 'required|uuid',
            'password'              => 'required|string|min:6|confirmed',
            'password_confirmation' => 'required|string',
        ];
    }
}
