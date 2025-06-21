<?php

namespace App\Imports;

use App\Models\Employee;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class EmployeesImport implements ToModel, WithHeadingRow
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        if (empty($row['name']) || empty($row['email'])) {
            return null;
        }

        return new Employee([
            'name'           => $row['name'],
            'email'          => $row['email'],
            'phone'          => $row['phone'],
            'designation'    => $row['designation'],
            'joining_date'   => $this->transformDate($row['joining_date']),
            'relieving_date' => $this->transformDate($row['relieving_date']),
            'role'           => $row['role'] ?? 'employee',
            'password' => isset($row['password']) ? Hash::make($row['password']) : Hash::make('default123'),
        ]);
    }

    private function transformDate($value, $format = 'Y-m-d')
    {
        try {
            if (is_numeric($value)) {
                // Excel serial number to date
                return Carbon::instance(Date::excelToDateTimeObject($value))->format($format);
            } else {
                // Already in string format
                return Carbon::parse($value)->format($format);
            }
        } catch (\Exception $e) {
            return null; // return '' if needed
        }
    }
}
