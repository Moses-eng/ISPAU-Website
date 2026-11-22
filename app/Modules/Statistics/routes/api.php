<?php

use App\Modules\Statistics\Controllers\StatisticsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth/admin/statistics')
    ->group(function () {
        Route::get('/',       [StatisticsController::class, 'index']);
        Route::get('/badges', [StatisticsController::class, 'badges']);
    });
