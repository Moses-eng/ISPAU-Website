<?php

use App\Modules\Payment\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth/admin/payments')
    ->group(function () {
        Route::get   ('/list',      [PaymentController::class, 'index']);
        Route::get   ('/show/{id}', [PaymentController::class, 'show']);
        Route::post  ('/store',     [PaymentController::class, 'store']);
        Route::post  ('/update',    [PaymentController::class, 'update']);
        Route::delete('/delete',    [PaymentController::class, 'destroy']);
    });
