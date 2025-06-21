<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'employee_name',
        'start_date',
        'end_date',
        'reason',
        'status',
        'admin_id'
    ];
    public function employee()
{
    return $this->belongsTo(Employee::class, 'employee_id');
}

    public function admin()
{
    return $this->belongsTo(Employee::class, 'admin_id');
}
}
