
<?php

use App\Modules\Subscription\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth/admin/subscriptions')
    // ->middleware('auth:admin')
    ->group(function () {
        Route::get('/list',      [SubscriptionController::class, 'index']);
        Route::get('/show/{id}', [SubscriptionController::class, 'show']);
    });

Route::prefix('v1/auth/applicant/subscription')
    // ->middleware('auth:applicant')
    ->group(function () {
        Route::get('/', [SubscriptionController::class, 'mine']);
    });
