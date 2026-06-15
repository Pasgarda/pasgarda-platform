<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScoringRubric extends Model
{
    protected $fillable = [
        'event_id',
        'round',
        'parent_id',
        'category',
        'name',
        'code',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function children()
    {
        return $this->hasMany(ScoringRubric::class, 'parent_id')->orderBy('sort_order');
    }

    public function parent()
    {
        return $this->belongsTo(ScoringRubric::class, 'parent_id');
    }

    /**
     * Get active rubric items for a given event and category, ordered by sort_order.
     */
    public static function getItems(int $eventId, string $category): array
    {
        return static::where('event_id', $eventId)
            ->where('category', $category)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('name')
            ->toArray();
    }

    /**
     * Get all active rubric items for an event, grouped by category.
     */
    public static function getAllGrouped(int $eventId): array
    {
        $rubrics = static::where('event_id', $eventId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return $rubrics->groupBy('category')->map(function ($items) {
            return $items->pluck('name')->toArray();
        })->toArray();
    }

    /**
     * Valid categories for rubrics.
     */
    public static function categories(): array
    {
        return ['pbb', 'danton', 'variasi', 'formasi', 'danton_vafor', 'kostum', 'makeup'];
    }
}
