<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventSchedule extends Model
{
    protected $fillable = ['event_id', 'day_type', 'date_string', 'categories', 'timeline'];

    protected $casts = [
        'categories' => 'array',
        'timeline' => 'array',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
