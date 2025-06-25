<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pending Leave Requests</title>
</head>
<body>
    <h2>Hello {{ $manager->name ?? 'Manager' }},</h2>

    <p>The following leave requests are still pending approval:</p>

    <ul>
        @foreach($leaves as $leave)
            <li><strong>{{ $leave->employee->name }}</strong> ({{ $leave->start_date }} to {{ $leave->end_date }})</li>
        @endforeach
    </ul>

    <p>
        <a href="http://localhost:3000/hr-dashboard"
           style="display:inline-block;padding:10px 20px;background-color:#3490dc;color:white;text-decoration:none;border-radius:5px;">
            Review Now
        </a>
    </p>

    <p>Thanks,<br>
    {{ config('app.name') }}</p>
</body>
</html>
