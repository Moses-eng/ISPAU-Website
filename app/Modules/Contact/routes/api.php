<?php

use App\Modules\Contact\Controllers\ContactController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/public/contacts')
    ->group(function () {
        Route::post('/store', [ContactController::class, 'store']);
    });

Route::prefix('v1/auth/admin/contacts')
    ->group(function () {
        Route::get   ('/list',      [ContactController::class, 'index']);
        Route::get   ('/show/{id}', [ContactController::class, 'show']);
        Route::post  ('/update',    [ContactController::class, 'update']);
        Route::delete('/delete',    [ContactController::class, 'destroy']);
    });
