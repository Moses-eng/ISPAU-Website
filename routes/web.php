<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

// Database Management Routes
Route::get('/migrate', function(){
    Artisan::call('migrate', ['--force' => true]);
    return 'Migrations Done!';
});


// Cache Management Routes
Route::get('/config-cache', function() {
    Artisan::call('config:cache');
    return 'Config cache cleared';
});

Route::get('/clear-cache', function() {
    Artisan::call('cache:clear');
    return 'Application cache cleared';
});

Route::get('/view-clear', function() {
    Artisan::call('view:clear');
    return 'View cache cleared';
});

Route::get('/route-cache', function() {
    Artisan::call('route:cache');
    return 'Routes cache cleared';
});

Route::get('/clear-all', function() {
    Artisan::call('cache:clear');
    Artisan::call('view:clear');
    Artisan::call('config:clear');
    Artisan::call('route:clear');
    return 'All caches cleared!';
});

