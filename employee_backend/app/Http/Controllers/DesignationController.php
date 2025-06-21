<?php

namespace App\Http\Controllers;

use App\Models\Designation;
use Illuminate\Http\Request;
use App\Http\Requests\DesignationRequest;


class DesignationController extends Controller
{
    //
    public function index()
    {
        return Designation::all();
    }

    public function store(DesignationRequest $request)
    {
        $request->validate(['name' => 'required|string|unique:designations']);
        return Designation::create($request->only('name'));
    }

    public function show($id)
    {
        return Designation::findOrFail($id);
    }
    public function update(DesignationRequest $request, $id)
    {
        $request->validate([
            'name' => 'required|string|unique:designations,name,' . $id,
        ]);

        $designation = Designation::findOrFail($id);
        $designation->update($request->only('name'));
        return $designation;
    }

    public function destroy($id)
    {
        Designation::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
