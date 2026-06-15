<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contingent extends Model
{
    protected $fillable = [
        'event_id',
        'school_name',
        'region',
        'category_type',
        'logo_path',
        'is_reguler',
        'description',
        'status',
        'coach_name',
        'coach_phone',
        'coach_email',
        'sort_order',
        'coach_user_id',
    ];

    protected $casts = [
        'is_reguler' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function voteLogs()
    {
        return $this->hasMany(VoteLog::class);
    }

    public function supporterLogs()
    {
        return $this->hasMany(SupporterLog::class);
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }

    public function scoresFinalRound()
    {
        return $this->hasMany(ScoreFinalRound::class);
    }

    public function merchandiseSales()
    {
        return $this->hasMany(MerchandiseSale::class);
    }

    public function socialMediaLike()
    {
        return $this->hasOne(SocialMediaLike::class);
    }

    public function juryScores()
    {
        return $this->hasMany(JuryScore::class);
    }

    public function coachUser()
    {
        return $this->belongsTo(User::class, 'coach_user_id');
    }
}
