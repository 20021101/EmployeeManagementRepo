<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Offer Letter</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 13px; line-height: 1.8; }
        .container { width: 90%; margin: auto; }
        .header, .footer { text-align: center; }
        .signature { margin-top: 50px; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">

        <img src="{{ public_path('images/logo-BDEWyTls.png') }}" style="width: 120px; margin-bottom: 20px;" />
        
        <p>{{ \Carbon\Carbon::now()->format('d M Y') }}</p>

        <p><strong>To,</strong><br>
        {{ $employee->name }}<br>
        {{ $employee->email }}</p>

        <p><strong>Subject:</strong> Offer of Employment</p>

        <p>Dear {{ $employee->name }},</p>

        <p>We are pleased to offer you the position of <strong>{{ $employee->designation->name }}</strong> at <strong>Vervextech</strong>. Your joining date will be <strong>{{ \Carbon\Carbon::parse($joining)->format('d M Y') }}</strong>.</p>

        <p>The terms and conditions of your employment will be in accordance with our HR policies and will be communicated in detail on your first day.</p>

        <p>We are excited to welcome you to our team and are confident that you will contribute significantly to our success.</p>

        <p>Please sign and return a copy of this letter as a token of your acceptance.</p>

        <div class="signature">
            <p>Best Regards,<br><strong>HR Manager</strong><br>Vervextech</p>
        </div>
    </div>
</body>
</html>
