<?php

use App\Modules\Activity\Controllers\ActivityController;
use Illuminate\Support\Facades\Route;

// ---------- PUBLIC (website) ----------
Route::prefix('v1/public/activity')
    ->group(function () {
        Route::get('/list',        [ActivityController::class, 'publicIndex']);
        Route::get('/show/{slug}', [ActivityController::class, 'publicShow']);
    });

// ---------- ADMIN (dashboard) ----------
Route::prefix('v1/auth/admin/activity')
    // ->middleware('auth:admin')
    ->group(function () {
        Route::get   ('/list',      [ActivityController::class, 'index']);
        Route::get   ('/show/{id}', [ActivityController::class, 'show']);
        Route::post  ('/store',     [ActivityController::class, 'store']);
        Route::post  ('/update',    [ActivityController::class, 'update']);
        Route::delete('/delete',    [ActivityController::class, 'destroy']);
    });
