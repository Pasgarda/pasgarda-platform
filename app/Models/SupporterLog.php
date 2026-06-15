<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupporterLog extends Model
{
    protected $fillable = [
        'event_id',
        'issued_ticket_id',
        'contingent_id',
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
