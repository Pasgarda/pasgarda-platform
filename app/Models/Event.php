<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'description',
        'date_start',
        'date_end',
        'venue',
        'status',
        'max_tickets_per_user',
        'online_ticket_limit',
        'leaderboard_status',
        'voting_status',
        'supporter_status',
        'voting_day_1_status',
        'voting_day_2_status',
        'sponsor_voting_status',
        'qris_image',
        'max_merchandise_price',
        'ticket_sale_status',
        'wa_contacts',
        'merchandise_wa_contacts',
        'gate_status',
        'gate_schedules',
        'ticket_notification_email',
        'merchandise_notification_email',
    ];

    protected $casts = [
        'date_start' => 'date',
        'date_end' => 'date',
        'wa_contacts' => 'array',
        'merchandise_wa_contacts' => 'array',
        'gate_schedules' => 'array',
    ];

    public function contingents()
    {
        return $this->hasMany(Contingent::class);
    }

    public function ticketPackages()
    {
        return $this->hasMany(TicketPackage::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
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

    public function juryScores()
    {
        return $this->hasMany(JuryScore::class);
    }

    public function eventSchedules()
    {
        return $this->hasMany(EventSchedule::class);
    }

    public function contents()
    {
        return $this->hasMany(EventContent::class);
    }

    public function merchandiseProducts()
    {
        return $this->hasMany(MerchandiseProduct::class);
    }

    public function merchandisePurchases()
    {
        return $this->hasMany(MerchandisePurchase::class);
    }

    public function merchandiseOrders()
    {
        return $this->hasMany(MerchandiseOrder::class);
    }
}
