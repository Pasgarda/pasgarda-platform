<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialMediaLike extends Model
{
    protected $fillable = [
        'contingent_id',
        'likes_count_reels',
        'likes_count_posts',
    ];

    public function contingent()
    {
        return $this->belongsTo(Contingent::class);
    }
}
