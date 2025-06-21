<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Salary Slip</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 14px;
            color: #333;
            margin: 40px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h2 {
            margin: 0;
            color: #2c3e50;
        }

        .info,
        .salary-details {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .info td,
        .salary-details td {
            padding: 8px 12px;
        }

        .info td:first-child,
        .salary-details td:first-child {
            font-weight: bold;
            background-color: #f4f4f4;
            width: 200px;
        }

        .salary-details {
            border: 1px solid #ccc;
        }

        .salary-details td {
            border: 1px solid #ccc;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #888;
        }

        .amount {
            text-align: right;
        }
    </style>
</head>

<body>

    <div class="header">
        <h2>Monthly Salary Slip</h2>
        <p><strong>{{ $salary->month }}/{{ $salary->year }}</strong></p>
    </div>

    <table class="info">
        <tr>
            <td>Employee Name</td>
            <td>{{ $salary->employee->name }}</td>
        </tr>
        <tr>
            <td>Employee ID</td>
            <td>{{ $salary->employee->id ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td>Department</td>
            <td>{{ $salary->employee->department->name ?? 'N/A' }}</td>
        </tr>
    </table>

    <table class="salary-details">
        <tr>
            <td>Earnings</td>
            <td class="amount">&#8377;{{ number_format($salary->base_salary, 2) }}</td>
        </tr>
        <tr>
            <td>Leaves Taken</td>
            <td class="amount">{{ $salary->total_leaves }}</td>
        </tr>
        <tr>
            <td>Leave Deduction</td>
            <td class="amount">&#8377;{{ number_format($salary->deduction, 2) }}</td>
        </tr>
        <tr>
            <td><strong>Net Salary</strong></td>
            <td class="amount"><strong>&#8377;{{ number_format($salary->net_salary, 2) }}</strong></td>
        </tr>
    </table>

    <div class="footer">
        This is a system-generated salary slip and does not require a signature.
    </div>

</body>

</html>