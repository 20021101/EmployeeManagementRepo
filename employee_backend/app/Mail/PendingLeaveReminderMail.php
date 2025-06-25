<?php

namespace App\Mail;


use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Content;

class PendingLeaveReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $leaves;
    public $manager;

    public function __construct($leaves, $manager)
    {
        $this->leaves = $leaves;
        $this->manager = $manager;
    }

    
    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function build()
    {
        return $this->markdown('emails.pending_leaves')
            ->subject('🕒 Pending Leave Requests Reminder')
            ->with([
                'leaves' => $this->leaves,
                'manager' => $this->manager,
            ]);
    }
    /**
     * Get the attachments for the message.
     *
     * @return array
     */
    public function attachments()
    {
        return [];
    }
}
