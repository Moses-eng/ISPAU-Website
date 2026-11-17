<?php

use App\Modules\MembershipAdminNotification\Controllers\MembershipAdminNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/membership-admin/notifications')->group(function () {
    Route::get ('/',              [MembershipAdminNotificationController::class, 'index']);
    Route::get ('/recent',        [MembershipAdminNotificationController::class, 'recent']);
    Route::get ('/statistics',    [MembershipAdminNotificationController::class, 'statistics']);
    Route::put ('/mark-all-read', [MembershipAdminNotificationController::class, 'markAllAsRead']);
    Route::post('/store',         [MembershipAdminNotificationController::class, 'store']);
    Route::post('/bulk-delete',   [MembershipAdminNotificationController::class, 'bulkDelete']);

    // Wildcard routes LAST — UUID-constrained
    Route::get   ('/{id}',      [MembershipAdminNotificationController::class, 'show'])->whereUuid('id');
    Route::put   ('/{id}/read', [MembershipAdminNotificationController::class, 'markAsRead'])->whereUuid('id');
    Route::delete('/{id}',      [MembershipAdminNotificationController::class, 'destroy'])->whereUuid('id');
});
