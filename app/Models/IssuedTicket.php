<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IssuedTicket extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_id',
        'ticket_package_id',
        'unique_qr_hash',
        'buyer_name',
        'buyer_email',
        'phone',
        'check_in_status',
        'checked_in_at',
        'check_in_history',
        'vote_tokens_remaining',
        'days_remaining',
        'coupon_tokens_remaining',
        'sharing_tokens_remaining',
        'supporter_tokens_remaining',
        'supporter_contingent_id',
        'deleted_reason',
    ];

    protected $casts = [
        'check_in_status' => 'boolean',
        'checked_in_at' => 'datetime',
        'check_in_history' => 'array',
        'days_remaining' => 'integer',
        'coupon_tokens_remaining' => 'integer',
        'sharing_tokens_remaining' => 'integer',
        'supporter_tokens_remaining' => 'integer',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function ticketPackage()
    {
        return $this->belongsTo(TicketPackage::class);
    }

    public function voteLogs()
    {
        return $this->hasMany(VoteLog::class);
    }

    public function supporterLogs()
    {
        return $this->hasMany(SupporterLog::class);
    }

    public function supporterContingent()
    {
        return $this->belongsTo(Contingent::class, 'supporter_contingent_id');
    }
}
