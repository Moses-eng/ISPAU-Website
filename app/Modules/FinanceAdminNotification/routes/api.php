<?php

use App\Modules\FinanceAdminNotification\Controllers\FinanceAdminNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/finance-admin/notifications')->group(function () {
    Route::get ('/',              [FinanceAdminNotificationController::class, 'index']);
    Route::get ('/recent',        [FinanceAdminNotificationController::class, 'recent']);
    Route::get ('/statistics',    [FinanceAdminNotificationController::class, 'statistics']);
    Route::put ('/mark-all-read', [FinanceAdminNotificationController::class, 'markAllAsRead']);
    Route::post('/store',         [FinanceAdminNotificationController::class, 'store']);
    Route::post('/bulk-delete',   [FinanceAdminNotificationController::class, 'bulkDelete']);

    // Wildcard routes LAST — UUID-constrained
    Route::get   ('/{id}',      [FinanceAdminNotificationController::class, 'show'])->whereUuid('id');
    Route::put   ('/{id}/read', [FinanceAdminNotificationController::class, 'markAsRead'])->whereUuid('id');
    Route::delete('/{id}',      [FinanceAdminNotificationController::class, 'destroy'])->whereUuid('id');
});
