<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScoreFinalRound extends Model
{
    protected $table = 'scores_final_round';

    protected $fillable = [
        'event_id',
        'contingent_id',
        'pbb_score',
        'danton_score',
        'vafor_score',
        'score_juri_1',
        'score_juri_2',
        'penalties',
        'voting_bonus',
        'total_score',
        'juri_1_pbb_details',
        'juri_1_danton_details',
        'juri_1_variasi_details',
        'juri_1_formasi_details',
        'juri_1_danton_vafor_details',
        'juri_2_pbb_details',
        'juri_2_danton_details',
        'juri_2_variasi_details',
        'juri_2_formasi_details',
        'juri_2_danton_vafor_details',
        'juri_3_pbb_details',
        'juri_3_danton_details',
    ];

    protected $casts = [
        'pbb_score' => 'integer',
        'danton_score' => 'integer',
        'vafor_score' => 'integer',
        'score_juri_1' => 'integer',
        'score_juri_2' => 'integer',
        'penalties' => 'integer',
        'voting_bonus' => 'integer',
        'total_score' => 'integer',
        'juri_1_pbb_details' => 'array',
        'juri_1_danton_details' => 'array',
        'juri_1_variasi_details' => 'array',
        'juri_1_formasi_details' => 'array',
        'juri_1_danton_vafor_details' => 'array',
        'juri_2_pbb_details' => 'array',
        'juri_2_danton_details' => 'array',
        'juri_2_variasi_details' => 'array',
        'juri_2_formasi_details' => 'array',
        'juri_2_danton_vafor_details' => 'array',
        'juri_3_pbb_details' => 'array',
        'juri_3_danton_details' => 'array',
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
