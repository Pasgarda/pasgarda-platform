<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventContent extends Model
{
    protected $fillable = [
        'event_id',
        'key',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
