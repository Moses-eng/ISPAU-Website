<?php

use App\Modules\Receipt\Controllers\ReceiptController;
use Illuminate\Support\Facades\Route;

// ---- Applicant upload ----
Route::prefix('v1/auth/applicant/receipts')
    ->group(function () {
        Route::post('/upload', [ReceiptController::class, 'uploadReceipt']);
    });

// ---- Admin CRUD ----
Route::prefix('v1/auth/admin/receipts')
    ->group(function () {
        Route::get   ('/list',      [ReceiptController::class, 'index']);
        Route::get   ('/show/{id}', [ReceiptController::class, 'show']);
        Route::post  ('/store',     [ReceiptController::class, 'store']);
        Route::post  ('/update',    [ReceiptController::class, 'update']);
        Route::delete('/delete',    [ReceiptController::class, 'destroy']);
    });
