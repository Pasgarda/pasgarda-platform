<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HallOfFame extends Model
{
    protected $table = 'hall_of_fames';

    protected $fillable = ['year', 'event_name', 'champion', 'runner_up', 'best_commander', 'favorite'];
}
