<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Jobs\ProcessScoreAggregationJob;
use Illuminate\Console\Command;

class ScoreReaggregate extends Command
{
    protected $signature = 'scores:reaggregate {event?}';
    protected $description = 'Reaggregate all scores (backfill vafor_score, grand_total, etc.)';

    public function handle(): void
    {
        $events = $this->argument('event')
            ? [Event::where('slug', $this->argument('event'))->firstOrFail()]
            : Event::all();

        foreach ($events as $event) {
            $contingents = $event->contingents()->pluck('id');
            $bar = $this->output->createProgressBar($contingents->count());
            $bar->start();

            foreach ($contingents as $contingentId) {
                dispatch_sync(new ProcessScoreAggregationJob($event->id, $contingentId));
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $this->info("Done: {$event->name} ({$contingents->count()} kontingen)");
        }
    }
}
