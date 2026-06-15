<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchandisePurchase extends Model
{
    protected $fillable = [
        'event_id', 'user_id', 'contingent_id', 'product_id',
        'merchandise_order_id',
        'quantity', 'total_price', 'total_points', 'status',
        'approved_at', 'rejection_reason',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'total_price' => 'integer',
        'total_points' => 'integer',
        'approved_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(MerchandiseOrder::class, 'merchandise_order_id');
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }

    public function product()
    {
        return $this->belongsTo(MerchandiseProduct::class);
    }
}
