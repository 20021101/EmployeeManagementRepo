<?php

namespace App\Console\Commands;

use App\Models\Leave;
use App\Models\Employee;
use App\Mail\PendingLeaveReminderMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;


class SendPendingLeaveReminders extends Command
{
    protected $signature = 'send:pending-leave-reminders';
    protected $description = 'Send email reminders to HRs/Admins about unapproved leave requests';

    public function handle()
    {
        // previous month's pending leaves
        $pendingLeaves = Leave::with('employee')
            ->where('status', 'pending')
            ->get();

        if ($pendingLeaves->isEmpty()) {
            $this->info('No pending leaves found.');
            return;
        }

        $recipients = Employee::whereIn('role', ['admin', 'hr'])->get();

        if ($recipients->isEmpty()) {
            $this->warn('php  No HR/Admin users found to send emails.');
            return;
        }

        // Send same pending leaves to all HR/Admin
        foreach ($recipients as $manager) {
            Mail::to($manager->email)->send(new PendingLeaveReminderMail($pendingLeaves, $manager));
            Log::info("📧 Pending leave reminder sent to: {$manager->name} ({$manager->email}) | Role: {$manager->role}");
        }



        $this->info('Pending leave emails sent successfully.');
    }
}
