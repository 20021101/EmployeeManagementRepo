<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Authenticatable
{
    use HasFactory, HasApiTokens, SoftDeletes;

    protected $fillable = ['name', 'email', 'employee_id', 'password', 'phone', 'role', 'joining_date', 'relieving_date', 'designation_id', 'department_id', 'manager_id'];

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }
    public function designation()
    {
        return $this->belongsTo(Designation::class, 'designation_id');
    }


    public function department()
    {
        return $this->belongsTo(Department::class);
    }


    // Relationship with manager (one employee has one manager)
    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    // Relationship with subordinates (one manager has many subordinates)
    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'manager_id');
    }
}
