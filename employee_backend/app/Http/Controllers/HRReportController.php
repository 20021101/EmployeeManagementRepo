<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\Attendance;
use App\Models\Salary; 
use Carbon\Carbon;
use App\Http\Requests\GetMonthlyReportRequest;

class HRReportController extends Controller
{
    
    public function getMonthlyReport(GetMonthlyReportRequest $request)
    {
        $month = $request->query('month');
        $year = $request->query('year');

        $startOfMonth = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        $employees = Employee::with(['department', 'designation'])->get();
        $data = [];

        foreach ($employees as $employee) {
            $attendanceRecords = Attendance::where('employee_id', $employee->id)
                ->whereBetween('date', [$startOfMonth, $endOfMonth])
                ->get();

            $present = $attendanceRecords->where('status', 'present')->count();
            $absent = $attendanceRecords->where('status', 'absent')->count();
            $leave = $attendanceRecords->where('status', 'leave')->count();

            $leaves = Leave::where('employee_id', $employee->id)
                ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                    $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                        ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                        ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                            $q->where('start_date', '<=', $startOfMonth)
                              ->where('end_date', '>=', $endOfMonth);
                        });
                })
                ->get();

            $leaveApproved = $leaves->where('status', 'approved')->count();
            $leaveRejected = $leaves->where('status', 'rejected')->count();
            $leavePending = $leaves->where('status', 'pending')->count();

            $salary = Salary::where('employee_id', $employee->id)
                ->where('month', $month)
                ->where('year', $year)
                ->first();

            $data[] = [
                'employee' => $employee,
                'attendance' => [
                    'present' => $present,
                    'absent' => $absent,
                    'leave' => $leave
                ],
                'leave' => [
                    'approved' => $leaveApproved,
                    'rejected' => $leaveRejected,
                    'pending' => $leavePending
                ],
                'salary' => [
                    'base_salary' => $salary?->base_salary ?? 0,
                    'deduction' => $salary?->deduction ?? 0,
                    'net_salary' => $salary?->net_salary ?? 0
                ]
            ];
        }

        return response()->json($data);
    }

}
