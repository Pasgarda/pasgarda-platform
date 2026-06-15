<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchandiseProduct extends Model
{
    protected $fillable = [
        'event_id', 'name', 'price', 'points', 'is_active',
    ];

    protected $casts = [
        'price' => 'integer',
        'points' => 'integer',
        'is_active' => 'boolean',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function purchases()
    {
        return $this->hasMany(MerchandisePurchase::class, 'product_id');
    }
}
