<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScorePbbDetail extends Model
{
    protected $fillable = [
        'score_id',
        'movement_index',
        'score',
    ];

    protected $casts = [
        'score' => 'decimal:2',
    ];

    public function score()
    {
        return $this->belongsTo(Score::class);
    }
}
