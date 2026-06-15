<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchandiseSale extends Model
{
    protected $fillable = [
        'event_id',
        'contingent_id',
        'buyer_name',
        'qty',
        'total_price',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }
}
