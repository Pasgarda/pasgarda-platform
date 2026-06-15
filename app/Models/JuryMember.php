<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JuryMember extends Model
{
    protected $fillable = [
        'event_id',
        'round',
        'jury_type',
        'jury_number',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'jury_number' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get all active jury members for an event, grouped by type.
     * Returns: ['pbb' => [['id' => 1, 'name' => 'Haryoto'], ...], 'vafor' => [...], ...]
     */
    public static function getGroupedByType(int $eventId): array
    {
        $members = static::where('event_id', $eventId)
            ->where('is_active', true)
            ->orderBy('jury_number')
            ->get();

        return $members->groupBy('jury_type')->map(function ($items) {
            return $items->map(function ($m) {
                return [
                    'id' => $m->jury_number,
                    'name' => $m->name,
                ];
            })->values()->toArray();
        })->toArray();
    }

    /**
     * Get jury name by type and number for an event.
     */
    public static function getJuryName(int $eventId, string $juryType, int $juryNumber): string
    {
        $member = static::where('event_id', $eventId)
            ->where('jury_type', $juryType)
            ->where('jury_number', $juryNumber)
            ->first();

        return $member ? $member->name : "Juri {$juryNumber}";
    }

    /**
     * Valid jury types.
     */
    public static function juryTypes(): array
    {
        return ['pbb', 'vafor', 'makeup_kostum'];
    }
}
