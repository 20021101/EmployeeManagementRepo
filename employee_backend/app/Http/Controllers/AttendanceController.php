<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Attendance;
use App\Http\Requests\StoreAttendanceRequest;
use Carbon\Carbon;
use App\Helpers\DateHelper;
use Illuminate\Support\Facades\Log;



class AttendanceController extends Controller
{
    public function index()
    {
        return Attendance::with('employee')->get();
    }

    public function store(StoreAttendanceRequest $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,leave',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'break_in' => 'nullable|date_format:H:i',
            'break_out' => 'nullable|date_format:H:i',
            'total_hours' => 'nullable|string|max:20',
            'day_type' => 'nullable|in:full,half',

        ]);

        $exists = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $request->date)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Attendance already exists.'], 422);
        }

        return Attendance::create($request->all());
    }

    public function show($id)
{
    return response()->json(
        Attendance::with('employee')
            ->where('employee_id', $id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'date' => $record->date,
                    // Include other necessary fields
                ];
            })
    );
}

    public function update(StoreAttendanceRequest $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'status' => 'required|in:present,absent,leave',
            'check_in' => 'nullable|date_format:H:i',
            'check_out' => 'nullable|date_format:H:i',
            'break_in' => 'nullable|date_format:H:i',
            'break_out' => 'nullable|date_format:H:i',
            'total_hours' => 'nullable|string|max:20',
            'day_type' => 'nullable|in:full,half',

        ]);

        $duplicate = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $request->date)
            ->where('id', '!=', $id)
            ->exists();

        if ($duplicate) {
            return response()->json(['error' => 'Duplicate attendance entry.'], 422);
        }

        $attendance->update($request->all());
        return $attendance;
    }

    public function destroy($id)
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json(['message' => 'Attendance deleted successfully']);
    }

    public function punchIn(Request $request)
    {

        Log::info('🧪 PunchIn Payload:', $request->all());
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $today = Carbon::now()->format('Y-m-d');

        if (!DateHelper::isWorkingDay($today)) {
            return response()->json([
                'status' => 'holiday',
                'message' => 'Today is a holiday (Sunday / 2nd or 4th Saturday)',
            ], 200);
        }

        $employeeId = $request->employee_id;
        $today = now()->toDateString();

        $attendance = Attendance::firstOrCreate(
            ['employee_id' => $employeeId, 'date' => $today],
            ['status' => 'present']
        );

        if ($attendance->check_in) {
            return response()->json(['message' => 'Already punched in.'], 400);
        }

        $attendance->check_in = now()->timezone('Asia/Kolkata')->format('H:i:s');
        $attendance->save();

        return response()->json(['message' => 'Punch in successful.', 'data' => $attendance]);
    }

    public function breakIn(Request $request)
    {
        $today = now()->toDateString();
        $time = now()->timezone('Asia/Kolkata')->format('H:i');

        $attendance = Attendance::where('employee_id', $request->employee_id)->where('date', $today)->first();

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'Punch In required first.'], 400);
        }

        if ($attendance->break_in && !$attendance->break_out) {
            return response()->json(['message' => 'Already on break.'], 400);
        }

        $breaks = $attendance->breaks ?? [];
        $breaks[] = ['break_in' => $time];

        $attendance->break_in = $time;
        $attendance->break_out = null;
        $attendance->breaks = $breaks;
        $attendance->save();

        return response()->json(['message' => 'Break In successful', 'data' => $attendance]);
    }

    public function breakOut(Request $request)
    {
        $today = now()->toDateString();
        $time = now()->timezone('Asia/Kolkata')->format('H:i');

        $attendance = Attendance::where('employee_id', $request->employee_id)->where('date', $today)->first();

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'Punch In required first.'], 400);
        }

        $breaks = $attendance->breaks ?? [];
        foreach ($breaks as &$brk) {
            if (isset($brk['break_in']) && empty($brk['break_out'])) {
                $brk['break_out'] = $time;
                $attendance->break_out = $time;
                break;
            }
        }

        $attendance->breaks = $breaks;
        $attendance->save();

        return response()->json(['message' => 'Break Out successful', 'data' => $attendance]);
    }

    public function punchOut(Request $request)
    {
        $today = now()->toDateString();
        $time = now()->timezone('Asia/Kolkata')->format('H:i');

        $attendance = Attendance::where('employee_id', $request->employee_id)->where('date', $today)->first();

        if (!$attendance || !$attendance->check_in) {
            return response()->json(['message' => 'Punch In required first.'], 400);
        }

        if ($attendance->check_out) {
            return response()->json(['message' => 'Already punched out.'], 400);
        }

        $attendance->check_out = $time;

        $checkIn = Carbon::parse($attendance->check_in);
        $checkOut = Carbon::parse($time);

        $breaks = $attendance->breaks ?? [];
        $breakDuration = 0;

        foreach ($breaks as &$brk) {
            if (isset($brk['break_in']) && empty($brk['break_out'])) {
                $brk['break_out'] = $time;
            }

            if (isset($brk['break_in']) && isset($brk['break_out'])) {
                $in = Carbon::parse($brk['break_in']);
                $out = Carbon::parse($brk['break_out']);
                $breakDuration += $out->diffInMinutes($in);
            }
        }

        $attendance->breaks = $breaks;

        $workDuration = $checkOut->diffInMinutes($checkIn);
        $netMinutes = $workDuration - $breakDuration;



        // Half day logic
        if ($netMinutes < 240) { // Less than 4 hours
            $attendance->status = 'absent';
            $attendance->day_type = 'none';
        } elseif ($netMinutes >= 240 && $netMinutes < 480) { // 4-8 hours
            $attendance->day_type = 'half';
            $attendance->status = 'present';
        } else {
            $attendance->day_type = 'full';
            $attendance->status = 'present';
        }

        $hours = floor($netMinutes / 60);
        $minutes = $netMinutes % 60;

        $attendance->total_hours = "{$hours}h {$minutes}m";
        $attendance->save();

        return response()->json(['message' => 'Punch Out successful.', 'data' => $attendance]);
    }

    public function regularize(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'manual_check_in' => 'required|date_format:H:i',
            'manual_check_out' => 'required|date_format:H:i',
            'reason' => 'required|string|max:255',
            'status' => 'required|in:present,absent,leave,half_day', // Add status
        ]);

        if (auth()->user()->id !== (int)$request->employee_id || auth()->user()->role !== 'employee') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $attendance = Attendance::where('employee_id', $request->employee_id)
            ->where('date', $request->date)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Attendance not found'], 404);
        }

        $requestedIn = Carbon::parse($request->manual_check_in);
        $requestedOut = Carbon::parse($request->manual_check_out);

        $durationMinutes = $requestedOut->diffInMinutes($requestedIn);
        $hours = floor($durationMinutes / 60);
        $minutes = $durationMinutes % 60;

        $totalHours = "{$hours}h {$minutes}m";

        $attendance->requested_check_in = $requestedIn->format('H:i:s');
        $attendance->requested_check_out = $requestedOut->format('H:i:s');
        $attendance->total_hours = $totalHours;
        $attendance->regularize_reason = $request->reason;
        $attendance->is_regularized = true;
        $attendance->regularize_status = 'requested';
        $attendance->status = $request->status; // e.g. 'half_day'
        $attendance->save();

        return response()->json(['message' => 'Regularization request submitted']);
    }



    public function approveRegularization(Request $request, $id)
    {
        if (auth()->user()->role !== 'hr') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $attendance = Attendance::findOrFail($id);

        if (!$attendance->requested_check_in || !$attendance->requested_check_out) {
            return response()->json(['error' => 'Missing requested times'], 400);
        }

        if ($request->status === 'approved') {
            $checkIn = Carbon::parse($attendance->requested_check_in);
            $checkOut = Carbon::parse($attendance->requested_check_out);

            $durationMinutes = $checkOut->diffInMinutes($checkIn);
            $attendance->check_in = $checkIn->format('H:i:s');
            $attendance->check_out = $checkOut->format('H:i:s');
            $attendance->total_hours = $this->calculateHours($checkIn, $checkOut);

            // 🔁 Half-day logic
            if ($durationMinutes < 240) {
                $attendance->status = 'absent';
                $attendance->day_type = 'none';
            } elseif ($durationMinutes >= 240 && $durationMinutes < 480) {
                $attendance->status = 'half_day';
                $attendance->day_type = 'half';
            } else {
                $attendance->status = 'present';
                $attendance->day_type = 'full';
            }
        }

        $attendance->regularize_status = $request->status;
        $attendance->approved_by = auth()->id();
        $attendance->approved_at = now();
        $attendance->save();

        return response()->json(['message' => 'Regularization ' . $request->status]);
    }


    private function calculateHours($in, $out)
    {
        $start = Carbon::parse($in);
        $end = Carbon::parse($out);
        $mins = $end->diffInMinutes($start);
        $h = floor($mins / 60);
        $m = $mins % 60;
        return "{$h}h {$m}m";
    }

    public function pendingRegularizations()
    {
        if (auth('employee')->user()?->role !== 'hr') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return Attendance::with('employee')
            ->where('regularize_status', 'requested')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'date' => $item->date,
                    'employee' => [
                        'name' => optional($item->employee)->name,
                    ],
                    'manual_check_in' => $item->requested_check_in,
                    'manual_check_out' => $item->requested_check_out,
                    'reason' => $item->regularize_reason,
                    'status' => $item->regularize_status,
                ];
            });
    }



    public function getAttendanceRange(Request $request, $id)
    {
        $from = $request->query('from');
        $to = $request->query('to');

        $attendance = Attendance::where('employee_id', $id)
            ->whereBetween('date', [$from, $to])
            ->orderBy('date', 'asc')
            ->get();

        return response()->json($attendance);
    }


    public function getHolidays(Request $request)
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

        $holidays = [];

        // ✅ National/Company Fixed Holidays
        $fixedHolidays = [
            "$year-01-26" => 'Republic Day',
            "$year-05-01" => 'Maharashtra Day',
            "$year-08-15" => 'Independence Day',
            "$year-10-02" => 'Gandhi Jayanti',
            "$year-12-25" => 'Christmas',
        ];

        foreach ($fixedHolidays as $date => $title) {
            if (date('n', strtotime($date)) == $month) {
                $holidays[] = ['date' => $date, 'title' => $title, 'type' => 'holiday'];
            }
        }

        // ✅ Sunday and 2nd/4th Saturdays
        $saturdays = [];
        for ($i = 1; $i <= 31; $i++) {
            $date = \DateTime::createFromFormat('Y-n-j', "$year-$month-$i");
            if (!$date) continue;

            $dayOfWeek = $date->format('w'); // 0 = Sunday, 6 = Saturday
            $formattedDate = $date->format('Y-m-d');

            if ($dayOfWeek == 0) {
                $holidays[] = ['date' => $formattedDate, 'title' => 'Sunday', 'type' => 'weekly_off'];
            }

            if ($dayOfWeek == 6) $saturdays[] = $i;
        }

        // 2nd and 4th Saturdays
        if (!empty($saturdays[1])) {
            $holidays[] = [
                'date' => "$year-$month-" . str_pad($saturdays[1], 2, '0', STR_PAD_LEFT),
                'title' => '2nd Saturday',
                'type' => 'weekly_off'
            ];
        }

        if (!empty($saturdays[3])) {
            $holidays[] = [
                'date' => "$year-$month-" . str_pad($saturdays[3], 2, '0', STR_PAD_LEFT),
                'title' => '4th Saturday',
                'type' => 'weekly_off'
            ];
        }

        return response()->json($holidays);
    }





    /*public function handleRegularizationAction(Request $request, $id, $action)
{
    if (auth()->user()->role !== 'hr') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $attendance = Attendance::findOrFail($id);

    if ($action === 'approve') {
        $attendance->check_in = $attendance->requested_check_in;
        $attendance->check_out = $attendance->requested_check_out;
        $attendance->total_hours = $this->calculateHours($attendance->check_in, $attendance->check_out);
        $attendance->status = 'present';
    }

    $attendance->regularize_status = $action === 'approve' ? 'approved' : 'rejected';
    $attendance->approved_by = auth()->id();
    $attendance->approved_at = now();
    $attendance->save();

    return response()->json(['message' => 'Regularization ' . $action]);
}*/
}
