<?php

use App\Modules\Banner\Controllers\BannerController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public/banners')
    ->group(function () {
        Route::get('/list', [BannerController::class, 'publicIndex']);
    });

Route::prefix('v1/auth/admin/banners')->middleware(['auth:system_users'])
    ->group(function () {
        Route::get   ('/list',      [BannerController::class, 'index']);
        Route::get   ('/show/{id}', [BannerController::class, 'show']);
        Route::post  ('/store',     [BannerController::class, 'store']);
        Route::post  ('/update',    [BannerController::class, 'update']);
        Route::delete('/delete',    [BannerController::class, 'destroy']);
    });
