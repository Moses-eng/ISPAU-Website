<?php

use App\Modules\AdminNotification\Controllers\AdminNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/notifications')->group(function () {
    Route::get ('/',              [AdminNotificationController::class, 'index']);
    Route::get ('/recent',        [AdminNotificationController::class, 'recent']);
    Route::get ('/statistics',    [AdminNotificationController::class, 'statistics']);
    Route::put ('/mark-all-read', [AdminNotificationController::class, 'markAllAsRead']);
    Route::post('/store',         [AdminNotificationController::class, 'store']);
    Route::post('/bulk-delete',   [AdminNotificationController::class, 'bulkDelete']);

    // Wildcard routes LAST — UUID-constrained
    Route::get   ('/{id}',      [AdminNotificationController::class, 'show'])->whereUuid('id');
    Route::put   ('/{id}/read', [AdminNotificationController::class, 'markAsRead'])->whereUuid('id');
    Route::delete('/{id}',      [AdminNotificationController::class, 'destroy'])->whereUuid('id');
});
