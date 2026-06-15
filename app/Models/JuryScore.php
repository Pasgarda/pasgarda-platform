<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JuryScore extends Model
{
    protected $fillable = [
        'event_id',
        'round',
        'contingent_id',
        'jury_type',
        'jury_number',
        'pbb_score',
        'danton_score',
        'vafor_score',
        'variasi_score',
        'formasi_score',
        'danton_vafor_score',
        'kostum_score',
        'makeup_score',
        'penalties_score',
        'total_score',
        'pbb_details',
        'danton_details',
        'variasi_details',
        'formasi_details',
        'danton_vafor_details',
        'kostum_details',
        'makeup_details',
    ];

    protected $casts = [
        'pbb_score' => 'integer',
        'danton_score' => 'integer',
        'vafor_score' => 'integer',
        'variasi_score' => 'integer',
        'formasi_score' => 'integer',
        'danton_vafor_score' => 'integer',
        'kostum_score' => 'integer',
        'makeup_score' => 'integer',
        'penalties_score' => 'integer',
        'total_score' => 'integer',
        'pbb_details' => 'array',
        'danton_details' => 'array',
        'variasi_details' => 'array',
        'formasi_details' => 'array',
        'danton_vafor_details' => 'array',
        'kostum_details' => 'array',
        'makeup_details' => 'array',
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
