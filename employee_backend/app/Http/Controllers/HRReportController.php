<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Leave;
use App\Models\Attendance;
use App\Models\Salary;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
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



    public function getMonthlySummary(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');

        $startOfMonth = Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = Carbon::create($year, $month, 1)->endOfMonth();

        // Get all employees
        $employees = Employee::all();

        // Preload attendances, leaves, salaries in fewer queries
        $attendances = Attendance::whereMonth('date', $month)->whereYear('date', $year)->get()->groupBy('employee_id');
        $leaves = Leave::where(function ($query) use ($startOfMonth, $endOfMonth) {
            $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->where('start_date', '<=', $startOfMonth)
                        ->where('end_date', '>=', $endOfMonth);
                });
        })->get()->groupBy('employee_id');

        $salaries = Salary::where('month', $month)->where('year', $year)->get()->keyBy('employee_id');

        // Initialize summary
        $summary = [
            'totalPresent' => 0,
            'totalAbsent' => 0,
            'totalAttendanceLeave' => 0,
            'totalBaseSalary' => 0,
            'totalDeductions' => 0,
            'totalNetSalary' => 0,
            'newJoinings' => 0,
            'totalLeaveApproved' => 0,
            'totalLeaveRejected' => 0,
            'totalLeavePending' => 0,
        ];

        foreach ($employees as $employee) {
            $empId = $employee->id;

            // Attendance Summary
            $empAttendances = $attendances->get($empId, collect());
            $summary['totalPresent'] += $empAttendances->where('status', 'present')->count();
            $summary['totalAbsent'] += $empAttendances->where('status', 'absent')->count();
            $summary['totalAttendanceLeave'] += $empAttendances->where('status', 'leave')->count();

            // Salary Summary
            $empSalary = $salaries->get($empId);
            if ($empSalary) {
                $summary['totalBaseSalary'] += $empSalary->base_salary ?? 0;
                $summary['totalDeductions'] += $empSalary->deduction ?? 0;
                $summary['totalNetSalary'] += $empSalary->net_salary ?? 0;
            }

             Log::info("Employee #$empId joining date: " . $employee->joining_date);


             // New Joining
            if (
                $employee->joining_date &&
                Carbon::parse($employee->joining_date)->month == $month &&
                Carbon::parse($employee->joining_date)->year == $year
            ) {
                $summary['newJoinings'] += 1;
            }

            // Leave Summary
            $empLeaves = $leaves->get($empId, collect());
            $summary['totalLeaveApproved'] += $empLeaves->where('status', 'approved')->count();
            $summary['totalLeaveRejected'] += $empLeaves->where('status', 'rejected')->count();
            $summary['totalLeavePending'] += $empLeaves->where('status', 'pending')->count();
        }

        return response()->json($summary);
    }
}
