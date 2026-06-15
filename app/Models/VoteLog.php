<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoteLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'event_id',
        'issued_ticket_id',
        'contingent_id',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function issuedTicket()
    {
        return $this->belongsTo(IssuedTicket::class);
    }

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }
}
