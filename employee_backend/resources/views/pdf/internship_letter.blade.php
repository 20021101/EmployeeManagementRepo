<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Internship Letter</title>
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

        <p><strong>Subject:</strong> Internship Offer Letter</p>

        <p>Dear {{ $employee->name }},</p>

        <p>We are pleased to inform you that you have been selected for an internship at <strong>Vervextech</strong> as a <strong>{{ $employee->designation->name }}</strong>, starting from <strong>{{ \Carbon\Carbon::parse($joining)->format('d M Y') }}</strong>.</p>

        <p>This internship will last for a period of 3 months. During this time, you are expected to fulfill assigned tasks and adhere to company policies.</p>

        <p>We believe this opportunity will provide you with valuable industry experience and learning.</p>

        <p>We welcome you aboard and wish you success during your internship.</p>

        <div class="signature">
            <p>Sincerely,<br><strong>HR Manager</strong><br>Vervextech</p>
        </div>
    </div>
</body>
</html>
