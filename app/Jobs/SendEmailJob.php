<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 30;

    public string $to;
    public string $subject;
    public string $body;
    public ?string $from;
    public ?string $fromName;

    public function __construct(string $to, string $subject, string $body, ?string $from = null, ?string $fromName = null)
    {
        $this->to = $to;
        $this->subject = $subject;
        $this->body = $body;
        $this->from = $from;
        $this->fromName = $fromName;
    }

    public function handle(): void
    {
        try {
            Mail::raw($this->body, function ($message) {
                $message->to($this->to)->subject($this->subject);
                if ($this->from) {
                    $message->from($this->from, $this->fromName ?? $this->from);
                }
            });
        } catch (\Exception $e) {
            Log::error("SendEmailJob failed to {$this->to}: {$e->getMessage()}");
            $this->fail($e);
        }
    }
}
