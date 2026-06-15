<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $fillable = ['user_id', 'rating', 'message', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeEnabled($q)
    {
        return $q->where('status', 'enabled');
    }
}
