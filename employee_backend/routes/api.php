<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeAuthController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\ExperienceLetterController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\HRReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Employee CRUD Routes
Route::middleware('throttle:100,1')->group(function () {
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
    Route::get('/employees/trashed', [EmployeeController::class, 'trashed']);
    Route::post('/employees/{id}/restore', [EmployeeController::class, 'restore']);
    Route::delete('/employees/{id}/force-delete', [EmployeeController::class, 'forceDelete']);

    Route::post('/employees/{id}/assign', [EmployeeController::class, 'assignDetails']);
    // Get employee with relationships
    Route::get('/employees/{id}/with-details', [EmployeeController::class, 'showWithRelations']);
    Route::post('/employees/import', [EmployeeController::class, 'import']);

    //to download all letters
    Route::get('/letter/{type}/{id}', [ExperienceLetterController::class, 'generateLetter']);




    // Profile Route
    Route::middleware('auth:sanctum')->get('/employee-profile', [EmployeeController::class, 'getProfile']);
});


// Login & Logout for Employees 
Route::prefix('employee')->group(function () {
    Route::post('/login', [EmployeeAuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('/logout', [EmployeeAuthController::class, 'logout']);
});

// ✅ Generic Logout Route for frontend (React) support  
/*Route::middleware('auth:sanctum')->post('/logout', function (Request $request) {
    $request->user()->tokens()->delete();
    return response()->json(['success' => true, 'message' => 'Logged out successfully']);
});*/

// Attendance Routes
Route::middleware('auth:employee')->group(function () {
    Route::get('/attendance/regularization-requests', [AttendanceController::class, 'pendingRegularizations']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::get('/attendance', [AttendanceController::class, 'index']);
  // Add in api.php
    Route::post('/attendance/punch-in', [AttendanceController::class, 'punchIn']);
    Route::post('/attendance/break-in', [AttendanceController::class, 'breakIn']);
    Route::post('/attendance/break-out', [AttendanceController::class, 'breakOut']);
    Route::post('/attendance/punch-out', [AttendanceController::class, 'punchOut']);
    //Route::get('/attendance/weekly/{employeeId}', [AttendanceController::class, 'weeklyLogs']);

    Route::post('/attendance/regularize', [AttendanceController::class, 'regularize']);
    Route::post('/attendance/regularize/{id}/approve', [AttendanceController::class, 'approveRegularization']);
    Route::put('/attendance/{id}', [AttendanceController::class, 'update']);
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);
    //Route::get('/attendance/{employee}', [AttendanceController::class, 'show']);
    Route::get('/employee/attendance/{id}/range', [AttendanceController::class, 'getAttendanceRange']);
    Route::get('/holidays', [AttendanceController::class, 'getHolidays']);

    Route::get('/me', function (Request $request) {
        return $request->user();
    });



    // Leave Routes
    Route::middleware('auth:sanctum')->group(function () {
        // Employee-specific leaves
        Route::get('/leaves/{employee_id}', [LeaveController::class, 'getLeavesByEmployee']);
        // Leave CRUD
        Route::post('/leaves', [LeaveController::class, 'store']);
        Route::put('/leaves/{id}', [LeaveController::class, 'update']);
        Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);
        // Admin actions
        Route::put('/leaves/{id}/status', [LeaveController::class, 'updateStatus']);
        Route::get('/leaves', [LeaveController::class, 'index']);
        Route::get('/leaves/show/{id}', [LeaveController::class, 'show']);
        Route::get('/employee-leaves', [LeaveController::class, 'getMonthlyLeaves']);


        //salary routes

        //Route::post('/salary/calculate', [SalaryController::class, 'calculateSalary']);
        //Route::get('/salary/slip/{id}', [SalaryController::class, 'downloadSlip']);


        // 🔷 Department Routes
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::get('/departments/{id}', [DepartmentController::class, 'show']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);
        Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

        // 🔷 Designation Routes
        Route::get('/designations', [DesignationController::class, 'index']);
        Route::post('/designations', [DesignationController::class, 'store']);
        Route::get('/designations/{id}', [DesignationController::class, 'show']);
        Route::put('/designations/{id}', [DesignationController::class, 'update']);
        Route::delete('/designations/{id}', [DesignationController::class, 'destroy']);
    });


    //salary routes
    Route::post('/salary/calculate', [SalaryController::class, 'calculateSalary']);
    Route::get('/salary/slip/{id}', [SalaryController::class, 'downloadSlip']);

    //monthly report route
    Route::middleware('auth:sanctum')->get('/hr/monthly-report', [HRReportController::class, 'getMonthlyReport']);
    Route::get('/hr/monthly-summary', [HRReportController::class, 'getMonthlySummary']);
});
