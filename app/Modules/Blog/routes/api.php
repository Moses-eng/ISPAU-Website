<?php

use App\Modules\Blog\Controllers\BlogController;
use Illuminate\Support\Facades\Route;

// ---------- PUBLIC (website) ----------
Route::prefix('v1/public/blog')
    ->group(function () {
        Route::get('/list',      [BlogController::class, 'publicIndex']);
        Route::get('/show/{slug}', [BlogController::class, 'publicShow']);
    });

// ---------- ADMIN ----------
Route::prefix('v1/auth/admin/blog')
    // ->middleware('auth:admin')
    ->group(function () {
        Route::get   ('/list',      [BlogController::class, 'index']);
        Route::get   ('/show/{id}', [BlogController::class, 'show']);
        Route::post  ('/store',     [BlogController::class, 'store']);
        Route::post  ('/update',    [BlogController::class, 'update']);
        Route::delete('/delete',    [BlogController::class, 'destroy']);
    });
