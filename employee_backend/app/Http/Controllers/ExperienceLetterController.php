<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Employee;

class ExperienceLetterController extends Controller
{
    //
    public function generateLetter($type, $employee_id)
    {
        $employee = Employee::findOrFail($employee_id);
        $joining = \Carbon\Carbon::parse($employee->joining_date)->format('d M Y');

        switch ($type) {
            case 'experience':
                $relieving = \Carbon\Carbon::parse($employee->relieving_date)->format('d M Y');

                $start = \Carbon\Carbon::parse($employee->joining_date);
                $end = \Carbon\Carbon::parse($employee->relieving_date);

                $years = $start->diffInYears($end);
                $months = $start->diffInMonths($end) % 12;

                $duration = '';
                if ($years > 0) {
                    $duration .= $years . ' year' . ($years > 1 ? 's' : '');
                }
                if ($months > 0) {
                    $duration .= ($duration ? ' ' : '') . $months . ' month' . ($months > 1 ? 's' : '');
                }

                $pdf = Pdf::loadView('pdf.experience_letter', compact('employee', 'joining', 'relieving', 'duration'));
                break;

            case 'offer':
                $pdf = Pdf::loadView('pdf.offer_letter', compact('employee', 'joining'));
                break;

            case 'internship':
                $pdf = Pdf::loadView('pdf.internship_letter', compact('employee', 'joining'));
                break;

            case 'increment':
                $pdf = Pdf::loadView('pdf.increment_letter', compact('employee', 'joining'));
                break;

            default:
                abort(404, 'Invalid letter type');
        }

        $filename = ucfirst($type) . '_Letter_' . $employee->name . '.pdf';
        return $pdf->download($filename);
    }
}

