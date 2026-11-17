<?php

use App\Modules\HeroSlide\Controllers\HeroSlideController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public/hero-slides')
    ->group(function () {
        Route::get('/list', [HeroSlideController::class, 'publicIndex']);
    });

Route::prefix('v1/auth/admin/hero-slides')->middleware(['auth:system_users'])
    ->group(function () {
        Route::get   ('/list',      [HeroSlideController::class, 'index']);
        Route::get   ('/show/{id}', [HeroSlideController::class, 'show']);
        Route::post  ('/store',     [HeroSlideController::class, 'store']);
        Route::post  ('/update',    [HeroSlideController::class, 'update']);
        Route::delete('/delete',    [HeroSlideController::class, 'destroy']);
    });
