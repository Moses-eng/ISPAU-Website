<?php
namespace App\Modules\SystemUser\Rules;

use App\Modules\SystemUser\Models\SystemUserModel;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class FinanceAdminRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return; // nullable — let the field's own nullable rule decide
        }

        $user = SystemUserModel::find($value);

        if (! $user) {
            $fail('The selected confirmed_by user does not exist.');
            return;
        }

        if (! $user->isFinanceAdmin()) {
            $fail('The confirmed_by user must have the finance_admin role.');
        }
    }
}
