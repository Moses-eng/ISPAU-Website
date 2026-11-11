<?php
use App\Modules\StaffHistory\Controllers\StaffHistoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth/system-users/staff-history')->middleware(['auth:system_users'])
    ->group(function () {
        Route::get('/list', [StaffHistoryController::class, 'index']);
    });
