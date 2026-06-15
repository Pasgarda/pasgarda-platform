<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchandiseOrder extends Model
{
    protected $fillable = [
        'event_id', 'user_id', 'buyer_phone', 'contingent_id',
        'total_price', 'total_points', 'status',
        'payment_proof', 'approved_at', 'rejection_reason',
        'expires_at',
    ];

    protected $casts = [
        'total_price' => 'integer',
        'total_points' => 'integer',
        'approved_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

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

    public function purchases()
    {
        return $this->hasMany(MerchandisePurchase::class, 'merchandise_order_id');
    }
}
