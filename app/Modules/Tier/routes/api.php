<?php

use App\Modules\Tier\Controllers\TierController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public/tiers')
    ->group(function () {
        Route::get ('/list',  [TierController::class, 'publicIndex']);
    });

Route::prefix('v1/auth/admin/tiers')->middleware(['auth:system_users'])
    ->group(function () {
        Route::get   ('/list',      [TierController::class, 'index']);
        Route::get   ('/show/{id}', [TierController::class, 'show']);
        Route::post('/store', [TierController::class, 'store']);
        Route::post  ('/update',    [TierController::class, 'update']);
        Route::delete('/delete',    [TierController::class, 'destroy']);
    });

