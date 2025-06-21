<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use App\Http\Requests\LoginRequest;
use App\Models\Employee;

class EmployeeAuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
    
        $employee = Employee::where('email', $validated['email'])->first();
    
        if (!$employee || !Hash::check($validated['password'], $employee->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
    
        // Create a token for the employee
        $token = $employee->createToken('employee-app')->plainTextToken;
    
        return response()->json([
            'employee' => $employee,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
{
    $token = $request->bearerToken();

    if ($token) {
        $accessToken = PersonalAccessToken::findToken($token);
        if ($accessToken) {
            $accessToken->delete(); // Delete current token
            return response()->json(['message' => 'Successfully logged out']);
        }
    }

    return response()->json(['message' => 'Token not found'], 401);
}
}
