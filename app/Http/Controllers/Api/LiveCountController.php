<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contingent;
use App\Models\Event;
use App\Models\Score;
use App\Models\ScoreFinalRound;
use App\Models\VoteLog;
use App\Models\SupporterLog;
use App\Models\MerchandiseOrder;
use App\Models\SocialMediaLike;
use Illuminate\Support\Facades\Cache;

class LiveCountController extends Controller
{
    public function voteCounts($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        return response()->json(Cache::remember("live_leaderboard_{$event->id}", 8, function () use ($event) {
            $contingents = Contingent::where('event_id', $event->id)
            ->where('status', 'verified')
            ->orderBy('sort_order')
            ->get();

        $voteCounts = VoteLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')
            ->pluck('total', 'contingent_id');

        $supporterCounts = SupporterLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, COUNT(*) as total')
            ->groupBy('contingent_id')
            ->pluck('total', 'contingent_id');

        $merchantCounts = MerchandiseOrder::where('event_id', $event->id)
            ->where('status', 'approved')
            ->selectRaw('contingent_id, SUM(total_points) as total')
            ->groupBy('contingent_id')
            ->pluck('total', 'contingent_id');

        $voteLastAt = VoteLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        $merchantLastAt = MerchandiseOrder::where('event_id', $event->id)
            ->where('status', 'approved')
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        $supporterLastAt = SupporterLog::where('event_id', $event->id)
            ->selectRaw('contingent_id, MAX(created_at) as last_at')
            ->groupBy('contingent_id')
            ->pluck('last_at', 'contingent_id');

        $scores = Score::where('event_id', $event->id)
            ->get()
            ->keyBy('contingent_id');

        $finalScores = ScoreFinalRound::where('event_id', $event->id)
            ->get()
            ->groupBy('contingent_id');

        $socialLikes = SocialMediaLike::whereIn('contingent_id', $contingents->pluck('id'))
            ->get()
            ->keyBy('contingent_id');

        $data = [];
        foreach ($contingents as $c) {
            $score = $scores->get($c->id);
            $sm = $socialLikes->get($c->id);
            $frs = $finalScores->get($c->id, collect());
            $data[] = [
                'id' => $c->id,
                'school_name' => $c->school_name,
                'region' => $c->region,
                'category_type' => $c->category_type,
                'logo_path' => $c->logo_path,
                'is_reguler' => (bool) $c->is_reguler,
                'coach_name' => $c->coach_name ?? '',
                'votes' => (int) ($voteCounts[$c->id] ?? 0),
                'supporters' => (int) ($supporterCounts[$c->id] ?? 0),
                'merch' => (int) ($merchantCounts[$c->id] ?? 0),
                'vote_last_at' => $voteLastAt[$c->id] ?? null,
                'merch_last_at' => $merchantLastAt[$c->id] ?? null,
                'supporter_last_at' => $supporterLastAt[$c->id] ?? null,
                'score_total' => $score ? (float) $score->grand_total : 0,
                'score_pbb' => $score ? (float) $score->pbb_score : 0,
                'score_danton' => $score ? (float) $score->danton_score : 0,
                'score_vafor' => $score ? (float) $score->vafor_score : 0,
                'score_variasi' => $score ? (float) ($score->variasi_score ?? 0) : 0,
                'score_formasi' => $score ? (float) ($score->formasi_score ?? 0) : 0,
                'score_danton_vafor' => $score ? (float) ($score->danton_vafor_score ?? 0) : 0,
                'score_kostum' => $score ? (float) $score->kostum_score : 0,
                'score_makeup' => $score ? (float) $score->makeup_score : 0,
                'score_penalty' => $score ? (float) $score->penalties_score : 0,
                'kostum_penalty' => $score ? (float) ($score->kostum_penalty ?? 0) : 0,
                'nilai_kontingen_bonus' => $score ? (float) ($score->nilai_kontingen_bonus ?? 0) : 0,
                'final_score' => (float) ($finalScores->has($c->id) ? $frs->sum('total_score') : 0),
                'final_round_scores' => $frs->map(fn ($fs) => [
                    'total_score' => (float) $fs->total_score,
                    'pbb_score' => (float) $fs->pbb_score,
                    'danton_score' => (float) $fs->danton_score,
                    'vafor_score' => (float) $fs->vafor_score,
                    'penalties' => (float) ($fs->penalties ?? 0),
                    'voting_bonus' => (float) ($fs->voting_bonus ?? 0),
                ])->values(),
                'reels_likes' => $sm ? (int) $sm->likes_count_reels : 0,
                'posts_likes' => $sm ? (int) $sm->likes_count_posts : 0,
                'social_updated_at' => $sm?->updated_at?->toIso8601String(),
                'last_activity_at' => (function () use ($voteLastAt, $merchantLastAt, $supporterLastAt, $c, $score, $sm) {
                    $timestamps = array_filter([
                        $voteLastAt[$c->id] ?? null,
                        $merchantLastAt[$c->id] ?? null,
                        $supporterLastAt[$c->id] ?? null,
                        $score?->updated_at?->toIso8601String(),
                        $sm?->updated_at?->toIso8601String(),
                    ]);
                    return !empty($timestamps) ? max($timestamps) : null;
                })(),
            ];
        }

        return $data;
        }));
    }
}
