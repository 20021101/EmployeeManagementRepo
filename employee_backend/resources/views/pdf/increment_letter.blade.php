<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Increment Letter</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 13px; line-height: 1.8; }
        .container { width: 90%; margin: auto; }
        .signature { margin-top: 50px; }
    </style>
</head>
<body>
    <div class="container">

        <img src="{{ public_path('images/logo-BDEWyTls.png') }}" style="width: 120px; margin-bottom: 20px;" />

        <p>{{ \Carbon\Carbon::now()->format('d M Y') }}</p>

        <p>To,<br>
        {{ $employee->name }}<br>
        {{ $employee->email }}</p>

        <p><strong>Subject:</strong> Salary Increment Notification</p>

        <p>Dear {{ $employee->name }},</p>

        <p>We are pleased to inform you that based on your performance and contribution, your salary has been revised effective from <strong>{{ \Carbon\Carbon::parse($joining)->format('d M Y') }}</strong>.</p>

        <p>Your new designation will remain as <strong>{{ $employee->designation->name }}</strong>. The updated salary details will be shared with you separately.</p>

        <p>We appreciate your continued efforts and look forward to your valuable contributions in the future.</p>

        <div class="signature">
            <p>Regards,<br><strong>HR Manager</strong><br>Vervextech</p>
        </div>
    </div>
</body>
</html>
