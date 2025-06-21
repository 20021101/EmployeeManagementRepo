<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Http\Requests\StoreAttendanceRequest;


class AttendanceController extends Controller
{
    /**
     * Show all attendance records with related employee data.
     */
    public function index()
    {
        return Attendance::with('employee')->get();
    }

    /**
     * Store a new attendance entry with validation and duplicate check.
     */
    public function store(StoreAttendanceRequest $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,leave',
        ], [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date format is invalid.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be either present, absent, or leave.',
        ]);

        // ✅ Check if attendance for that employee and date already exists
        $exists = Attendance::where('employee_id', $request->employee_id)
                            ->where('date', $request->date)
                            ->exists();

        if ($exists) {
            return response()->json([
                'error' => 'Attendance for this employee on this date already exists.'
            ], 422);
        }

        return Attendance::create($request->all());
    }

    /**
     * Show attendance history of a specific employee.
     */
    public function show($id)
    {
        $attendance = Attendance::with('employee')
            ->where('employee_id', $id)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($attendance);
    }

    /**
     * Update an existing attendance entry with validation.
     */
    public function update(StoreAttendanceRequest $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,leave',
        ], [
            'employee_id.required' => 'Employee is required.',
            'employee_id.exists' => 'Selected employee does not exist.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date format is invalid.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be either present, absent, or leave.',
        ]);

        // ❗ Optional: Prevent duplicate when changing date or employee
        $duplicate = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $request->date)
            ->where('id', '!=', $id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'error' => 'Another attendance entry for this employee and date already exists.'
            ], 422);
        }

        $attendance->update($request->all());
        return $attendance;
    }

    /**
     * Delete an attendance entry.
     */
    public function destroy($id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json(['message' => 'Attendance deleted successfully']);
    }
}
