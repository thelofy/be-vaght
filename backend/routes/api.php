<?php

use App\Http\Controllers\Api\V1\BookingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Public Customer Booking API
|--------------------------------------------------------------------------
*/
Route::prefix('v1/salons/{slug}')->group(function () {
    Route::get('/', [BookingController::class, 'show'])->name('api.v1.salons.show');
    Route::get('/slots', [BookingController::class, 'slots'])->name('api.v1.salons.slots');
    Route::post('/book', [BookingController::class, 'book'])->name('api.v1.salons.book');
});
