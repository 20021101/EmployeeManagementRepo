<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'status',
        'check_in',
        'check_out',
        'break_in',
        'break_out',
        'breaks',
        'total_hours',
        'is_regularized',
        'regularize_status',
        'regularize_reason',
        'requested_check_in',
        'requested_check_out',
        'approved_by',
        'approved_at',
        'day_type',

    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'breaks' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
