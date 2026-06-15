<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketPackage extends Model
{
    protected $fillable = [
        'event_id',
        'type',
        'name',
        'price',
        'validity_days',
        'vote_allowance',
        'coupon_allowance',
        'sharing_allowance',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'sharing_allowance' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function issuedTickets()
    {
        return $this->hasMany(IssuedTicket::class);
    }
}
