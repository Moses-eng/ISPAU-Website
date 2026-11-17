<?php

use App\Modules\OperationsOfficerNotification\Controllers\OperationsOfficerNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/operations-officer/notifications')->group(function () {
    Route::get ('/',              [OperationsOfficerNotificationController::class, 'index']);
    Route::get ('/recent',        [OperationsOfficerNotificationController::class, 'recent']);
    Route::get ('/statistics',    [OperationsOfficerNotificationController::class, 'statistics']);
    Route::put ('/mark-all-read', [OperationsOfficerNotificationController::class, 'markAllAsRead']);
    Route::post('/store',         [OperationsOfficerNotificationController::class, 'store']);
    Route::post('/bulk-delete',   [OperationsOfficerNotificationController::class, 'bulkDelete']);

    // Wildcard routes LAST — UUID-constrained
    Route::get   ('/{id}',      [OperationsOfficerNotificationController::class, 'show'])->whereUuid('id');
    Route::put   ('/{id}/read', [OperationsOfficerNotificationController::class, 'markAsRead'])->whereUuid('id');
    Route::delete('/{id}',      [OperationsOfficerNotificationController::class, 'destroy'])->whereUuid('id');
});
