<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            line-height: 1.6;
            margin: 50px;
            font-size: 14px;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .logo {
            width: 180px; /* Adjusted logo size */
        }

        .title {
            flex-grow: 1;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .content {
            text-align: justify;
        }

        .signature {
            margin-top: 80px;
            text-align: right;
        }

        .footer {
            position: absolute;
            bottom: 30px;
            width: 100%;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>

    <div class="header">
        <div>
            <img class="logo" src="{{ public_path('images/logo-BDEWyTls.png') }}" alt="Company Logo">
        </div>
        <div class="title">
            TO WHOMSOEVER IT MAY CONCERN
        </div>
        <div style="width: 180px;"></div> <!-- Spacer for alignment -->
    </div>

    <div class="content">
        <p>
            This is to certify that Mr./Ms. <strong>{{ $employee->name }}</strong> was employed with our organization
            as a <strong>{{ $employee->designation->name }}</strong> from <strong>{{ $joining }}</strong> to
            <strong>{{ $relieving }}</strong>.
        </p>

        <p>
            During the tenure of <strong>{{ $duration }}</strong>, we found them to be professional, sincere,
            and dedicated to their responsibilities. They have shown good performance and maintained a positive attitude
            throughout the tenure.
        </p>

        <p>
            We wish them all the best in their future endeavors.
        </p>
    </div>

    <div class="signature">
        <p>Sincerely,</p>
        <p><strong>HR Department</strong></p>
    </div>

    <div class="footer">
        Company Name · Company Address · Phone · Email
    </div>

</body>
</html>
