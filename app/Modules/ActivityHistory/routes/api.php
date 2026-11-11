<?php
use App\Modules\ActivityHistory\Controllers\ActivityHistoryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth/system-users/activity')->middleware(['auth:system_users'])
    ->group(function () {
        Route::get('/list',   [ActivityHistoryController::class, 'index']);
        Route::get('/actors', [ActivityHistoryController::class, 'actors']);
    });
