<?php

use App\Modules\Invoice\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth/admin/invoices')
    ->group(function () {
        Route::get   ('/list',      [InvoiceController::class, 'index']);
        Route::get   ('/show/{id}', [InvoiceController::class, 'show']);
        Route::post  ('/store',     [InvoiceController::class, 'store']);
        Route::post  ('/update',    [InvoiceController::class, 'update']);
        Route::delete('/delete',    [InvoiceController::class, 'destroy']);
    });
