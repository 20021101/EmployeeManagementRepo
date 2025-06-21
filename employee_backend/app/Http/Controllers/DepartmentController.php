<?php

namespace App\Http\Controllers;

use App\Models\Department;

use Illuminate\Http\Request;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;


class DepartmentController extends Controller
{
    //
    public function index()
    {
        return Department::all();
    }

    public function store(StoreDepartmentRequest $request)
    {
        $request->validate(['name' => 'required|string|unique:departments']);
        return Department::create($request->only('name'));
    }
    public function show($id)
    {
        return Department::findOrFail($id);
    }

    public function update(UpdateDepartmentRequest $request, $id)
    {
        $dept = Department::findOrFail($id);

        $request->validate([
            'name' => 'required|string|unique:departments,name,' . $id,
        ]);

        $dept->update($request->only('name'));

        return $dept;
    }
    public function destroy($id)
    {
        Department::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
