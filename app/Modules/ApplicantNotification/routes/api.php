<?php
use App\Modules\ApplicantNotification\Controllers\ApplicantNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/applicant/notifications')->group(function () {
    Route::get ('/list/{applicantId}',         [ApplicantNotificationController::class, 'index']);
    Route::get ('/recent/{applicantId}',       [ApplicantNotificationController::class, 'recent']);
    Route::get ('/statistics/{applicantId}',   [ApplicantNotificationController::class, 'statistics']);
    Route::put ('/mark-all-read/{applicantId}',[ApplicantNotificationController::class, 'markAllAsRead']);
    Route::post('/store',                      [ApplicantNotificationController::class, 'store']);
    Route::post('/bulk-delete',                [ApplicantNotificationController::class, 'bulkDelete']);

    // Wildcard routes LAST
    Route::get   ('/{id}',        [ApplicantNotificationController::class, 'show'])->whereNumber('id');
    Route::put   ('/{id}/read',   [ApplicantNotificationController::class, 'markAsRead'])->whereNumber('id');
    Route::delete('/{id}',        [ApplicantNotificationController::class, 'destroy'])->whereNumber('id');
});
