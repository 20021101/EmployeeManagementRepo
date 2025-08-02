<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use App\Models\Employee;
use App\Models\Leave;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Http\Requests\StoreLeaveRequest;
use App\Http\Requests\UpdateLeaveStatusRequest;



class LeaveController extends Controller
{
    //
    public function index(Request $request)
    {
        $user = auth()->user();

        if (in_array($user->role, ['admin', 'hr'])) {
            return Leave::with(['employee', 'admin:id,role'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            return Leave::with(['employee', 'admin:id,role'])
                ->where('employee_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }
    }


    // 2. Employee applies for leave
    public function store(StoreLeaveRequest $request)
    {

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'name' => 'required|string|max:255',
            'reason' => 'required|string|max:500',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $leave = Leave::create([
            'employee_id' => $request->employee_id,
            'name' => $request->name,
            'reason' => $request->reason,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'status' => 'pending',
        ]);

        //  Send email to all admins and HR
        $managers = Employee::whereIn('role', ['admin', 'hr'])->get();

        foreach ($managers as $manager) {
            Mail::raw(
                "New leave request submitted by {$leave->name} from {$leave->start_date} to {$leave->end_date}.\nReason: {$leave->reason}",
                function ($message) use ($manager) {
                    $message->to($manager->email)
                        ->subject("New Leave Request");
                }
            );
        }

        return response()->json(['message' => 'Leave request submitted. Email sent to all admins and all hr.']);
    }


    // 3. Get leaves for a specific employee
    public function getLeavesByEmployee($employee_id)
    {
        $leaves = Leave::with('employee', 'admin')
            ->where('employee_id', $employee_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($leaves);
    }

    // 4. Show single leave details
    public function show($id)
    {
        $leave = Leave::with('employee', 'admin')->findOrFail($id);
        return response()->json($leave);
    }

    // 5. Update leave request (Employee edit)
    public function update(Request $request, $id)
    {
        $leave = Leave::findOrFail($id);
        $leave->status = $request->status;
        $leave->employee_id = $request->admin_id; // Save admin id
        //$leave->admin_id = auth('sanctum')->user()->id;
        $leave->save();

        return response()->json(['message' => 'Leave status updated successfully']);
    }

    // 6. Admin updates leave status
    public function updateStatus(UpdateLeaveStatusRequest $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_id' => 'required|exists:employees,id',
        ]);

        // Find the employee (Admin or HR) who is updating the status
        $handler = Employee::findOrFail($request->admin_id);

        // Allow both admin and HR to approve/reject
        if (!in_array($handler->role, ['admin', 'hr'])) {
            return response()->json(['error' => 'Only admin or HR can update leave status.'], 403);
        }

        // Find the leave
        $leave = Leave::findOrFail($id);
        $leave->status = $request->status;
        $leave->admin_id = $handler->id; // This stores the handler (HR/Admin)
        $leave->save();

        // Notify the employee
        $employee = Employee::find($leave->employee_id);
        if ($employee) {
            Mail::raw(
                "Hi {$employee->name},\nYour leave request from {$leave->start_date} to {$leave->end_date} has been {$leave->status} by {$handler->role} ({$handler->email}).",
                function ($message) use ($employee) {
                    $message->to($employee->email)
                        ->subject('Leave Status Update');
                }
            );
        }

        return response()->json(['message' => 'Leave status updated. Email sent to employee.']);
    }



    //  Delete leave request
    public function destroy($id)
    {
        $leave = Leave::findOrFail($id);
        $leave->delete();

        return response()->json(['message' => 'Leave deleted successfully']);
    }


    public function hrDashboard()
    {
        $pendingLeaves = Leave::where('status', 'pending')->with('employee')->get();
        $manager = auth()->user();

        if (!$manager) {
            abort(403, 'Unauthorized');
        }

        return view('hr_dashboard.pending_leaves', compact('pendingLeaves', 'manager'));
    }


    public function getMonthlyLeaves(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
        ]);

        $leaves = Leave::where('employee_id', $request->employee_id)
            ->where(function ($query) use ($request) {
                $query->whereMonth('start_date', $request->month)
                    ->whereYear('start_date', $request->year)
                    ->orWhereMonth('end_date', $request->month)
                    ->whereYear('end_date', $request->year);
            })
            ->get(['id', 'start_date', 'end_date', 'status']);

        return response()->json($leaves);
    }
}
