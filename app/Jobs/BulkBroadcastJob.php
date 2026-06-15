<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class BulkBroadcastJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300;

    protected array $emails;
    protected string $subject;
    protected string $body;

    public function __construct(array $emails, string $subject, string $body)
    {
        $this->emails = $emails;
        $this->subject = $subject;
        $this->body = $body;
    }

    public function handle(): void
    {
        foreach ($this->emails as $email) {
            try {
                SendEmailJob::dispatch($email, $this->subject, $this->body);
            } catch (\Exception $e) {
                Log::error("BulkBroadcastJob failed to queue for {$email}: {$e->getMessage()}");
            }
        }
    }
}
