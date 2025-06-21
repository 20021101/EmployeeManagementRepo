<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Imports\EmployeesImport;
use Maatwebsite\Excel\Facades\Excel;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;


class EmployeeController extends Controller
{
    public function store(StoreEmployeeRequest $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:employees',
            'phone' => 'required',
            'designation_id' => 'required|exists:designations,id',
            'password' => 'required|min:6',
            'joining_date' => 'nullable|date',
            'relieving_date' => 'nullable|date',
            'role' => 'required|in:admin,hr,employee'
        ]);

        $employee = new Employee();
        $employee->name = $request->name;
        $employee->email = $request->email;
        $employee->phone = $request->phone;
        $employee->designation_id = $request->designation_id;
        $employee->joining_date = $request->joining_date;
        $employee->relieving_date = $request->relieving_date;
        $employee->role = $request->role;
        $employee->password = Hash::make($request->password);
        $employee->save();

        return response()->json(['message' => 'Employee saved successfully', 'employee' => $employee], 201);
    }

    public function index(Request $request)
    {
        $authUser = Auth::guard('employee')->user();

        $query = Employee::with(['designation', 'department']);

        if ($request->query('trashed') === 'true') {
            $query->onlyTrashed();
        } else {
            $query->withoutTrashed();
        }

        if ($authUser->role === 'employee') {
            $query->where('id', $authUser->id);
        }

        return response()->json($query->get());
    }

    public function update(UpdateEmployeeRequest $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $authUser = Auth::guard('employee')->user();

        if ($authUser->role === 'employee' && $authUser->id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email,' . $id,
            'phone' => 'required|string|max:20',
            'designation_id' => 'nullable|exists:designations,id',
            'joining_date' => 'nullable|date',
            'relieving_date' => 'nullable|date|after_or_equal:joining_date',
            'role' => 'required|in:admin,hr,employee',
        ]);

        $employee->update($validated);

        return response()->json([
            'message' => 'Employee updated successfully',
            'employee' => $employee
        ]);
    }


    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $authUser = Auth::guard('employee')->user();

        if ($authUser->role === 'employee' && $authUser->id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $employee->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function trashed()
    {
        return Employee::onlyTrashed()->get();
    }

    public function restore($id)
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $employee->restore();

        return response()->json(['message' => 'Employee restored successfully']);
    }

    public function forceDelete($id)
    {
        $employee = Employee::onlyTrashed()->findOrFail($id);
        $employee->forceDelete();

        return response()->json(['message' => 'Employee permanently deleted']);
    }

    public function getProfile()
    {
        $employee = Auth::guard('employee')->user();
        return response()->json($employee);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv',
        ]);

        try {
            Excel::import(new EmployeesImport, $request->file('file'));
            return response()->json(['message' => 'Employees imported successfully!']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function updateData(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $authUser = Auth::guard('employee')->user();

        if ($authUser->role === 'employee' && $authUser->id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'designation_id' => 'nullable|exists:designations,id',
            'department_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
        ]);

        $employee->update($request->only('designation_id', 'department_id', 'manager_id'));

        return $employee->load(['designation', 'department', 'manager']);
    }

    public function assignDetails(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        $authUser = Auth::guard('employee')->user();

        if ($authUser->role === 'employee' && $authUser->id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'designation_id' => 'nullable|exists:designations,id',
            'department_id' => 'nullable|exists:departments,id',
            'manager_id' => 'nullable|exists:employees,id',
        ]);

        $employee->designation_id = $request->designation_id;
        $employee->department_id = $request->department_id;
        $employee->manager_id = $request->manager_id;
        $employee->save();

        return response()->json([
            'message' => 'Employee updated successfully.',
            'employee' => $employee->load(['designation', 'department', 'manager'])
        ]);
    }

    public function showWithRelations($id)
    {
        $employee = Employee::with(['designation', 'department', 'manager'])->findOrFail($id);
        $authUser = Auth::guard('employee')->user();

        if ($authUser->role === 'employee' && $authUser->id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($employee);
    }
}
