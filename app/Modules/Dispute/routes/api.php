<?php

use App\Modules\Dispute\Controllers\DisputeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public/disputes')
    ->group(function () {
        Route::post('/store', [DisputeController::class, 'store']);
    });

Route::prefix('v1/auth/admin/disputes')
    ->group(function () {
        Route::get   ('/list',      [DisputeController::class, 'index']);
        Route::get   ('/show/{id}', [DisputeController::class, 'show']);
        Route::post  ('/update',    [DisputeController::class, 'update']);
        Route::delete('/delete',    [DisputeController::class, 'destroy']);
    });
