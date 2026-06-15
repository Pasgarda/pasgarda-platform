<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'midtrans_transaction_id',
        'total_price',
        'payment_status',
        'payment_method',
        'payment_proof',
        'rejected_reason',
        'contingent_id',
        'expires_at',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }

    public function issuedTickets()
    {
        return $this->hasMany(IssuedTicket::class);
    }
}
