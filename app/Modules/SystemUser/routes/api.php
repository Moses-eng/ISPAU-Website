<?php
use App\Modules\SystemUser\Controllers\SystemUserController;
use Illuminate\Support\Facades\Route;

// ---------- System User (public) ----------
Route::prefix('v1/public')->group(function () {
    Route::prefix('/system-users')->group(function () {
        Route::post('/register', [SystemUserController::class, 'register']);
        Route::post('/login',    [SystemUserController::class, 'login']);
    });
});

// ---------- System User auth (protected) ----------
Route::prefix('v1/auth/system-users')->middleware(['auth:system_users'])
    ->group(function () {
        Route::post  ('/logout',          [SystemUserController::class, 'logout']);
        Route::get   ('/profile',         [SystemUserController::class, 'profile']);
        Route::get   ('/list',            [SystemUserController::class, 'listAll']);
        Route::post  ('/update-profile',  [SystemUserController::class, 'updateProfile']);
        Route::post  ('/update-password', [SystemUserController::class, 'updatePassword']);
        Route::post('/reset-password', [SystemUserController::class, 'resetPassword']);
        Route::delete('/delete/{id}',     [SystemUserController::class, 'delete']);
    });
