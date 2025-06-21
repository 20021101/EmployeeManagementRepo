<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Salary;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

use App\Http\Requests\CalculateSalaryRequest;

use Illuminate\Http\Request;

class SalaryController extends Controller
{
    //
    public function calculateSalary(CalculateSalaryRequest $request)
    {

        $employeeId = $request->employee_id;
        $month = $request->month;
        $year = $request->year;
        $baseSalary = 30000;

        $leaves = Leave::where('employee_id', $employeeId)
            ->whereMonth('start_date', $month)
            ->whereYear('start_date', $year)
            ->where('status', 'approved')
            ->get();

        $totalLeaveDays = $leaves->sum(function ($leave) {
            return Carbon::parse($leave->end_date)->diffInDays($leave->start_date) + 1;
        });

        $paidLeaves = 2; // 2 free leaves
        $leaveDeduction = max(0, $totalLeaveDays - $paidLeaves);
        $deductionAmount = ($baseSalary / 30) * $leaveDeduction;
        $netSalary = $baseSalary - $deductionAmount;

        $salary = Salary::updateOrCreate(
            ['employee_id' => $employeeId, 'month' => $month, 'year' => $year],
            [
                'base_salary' => $baseSalary,
                'total_leaves' => $totalLeaveDays,
                'paid_leaves' => $paidLeaves,
                'deduction' => $deductionAmount,
                'net_salary' => $netSalary,
            ]
        );

        return response()->json($salary);
    }

    public function downloadSlip($id)
    {
        $salary = Salary::with(['employee.department'])->findOrFail($id);


        $pdf = PDF::loadView('salary.slip', ['salary' => $salary]);

        return $pdf->download("salary_slip_{$salary->employee->name}.pdf");
    }
}
