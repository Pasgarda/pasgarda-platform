<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScoreAccessToken extends Model
{
    protected $fillable = [
        'event_id', 'contingent_id', 'token', 'is_active', 'created_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
